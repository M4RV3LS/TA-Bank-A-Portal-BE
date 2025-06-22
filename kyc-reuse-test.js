import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// -- Custom Metrics --
// Trend metrik untuk melacak waktu eksekusi yang dilaporkan oleh server.
const ExecutionTime = new Trend('execution_time_ms');
// Rate metrik untuk melacak tingkat kegagalan verifikasi hash.
const HashMismatchRate = new Rate('hash_mismatches');

// -- Test Options --
export const options = {
  // stages mendefinisikan pola beban kerja:
  // - Ramp-up ke 20 VUs selama 30 detik
  // - Tahan di 20 VUs selama 1 menit (beban stabil)
  // - Ramp-down ke 0 VUs selama 15 detik
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '15s', target: 0 },
  ],
  // thresholds mendefinisikan kriteria keberhasilan/kegagalan pengujian.
  thresholds: {
    'http_req_failed': ['rate<0.01'], // Tingkat kegagalan HTTP di bawah 1%
    'http_req_duration': ['p(95)<1500'], // 95% permintaan harus selesai di bawah 1.5 detik
    'execution_time_ms': ['p(95)<1200'], // 95% waktu eksekusi backend harus di bawah 1.2 detik
    'hash_mismatches': ['rate<0.01'], // Tingkat ketidakcocokan hash harus di bawah 1%
  },
};

// -- Test Setup --
// Fungsi setup dijalankan sekali sebelum pengujian dimulai.
// Tujuannya adalah untuk mempersiapkan data yang dibutuhkan oleh VUs.
export function setup() {
  console.log('Setting up test data...');

  // Ganti dengan client_id yang valid yang sudah memiliki KYC terverifikasi di Bank A.
  const CLIENT_ID = 1; 
  // Ganti dengan nama nasabah yang sesuai.
  const CUSTOMER_NAME = "Alice"; 
  // Kode bank asal (Home Bank).
  const HOME_BANK_CODE = "BANK_A"; 

  // Buat permintaan 'reuse_kyc' baru di Bank B untuk setiap pengujian.
  const bankB_API_URL = 'http://localhost:5000/kyc-requests';

  const payload = {
    client_id: CLIENT_ID,
    customer_name: CUSTOMER_NAME,
    status_request: 'reuse_kyc',
    home_bank_code: HOME_BANK_CODE,
  };

  const res = http.post(JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
  });

  // Periksa apakah permintaan 'reuse_kyc' berhasil dibuat.
  if (res.status !== 201) {
    throw new Error('Could not create initial reuse_kyc request in setup. Aborting test.');
  }

  const requestId = res.json('request_id');
  console.log(`Setup complete. Using request_id: ${requestId} for client_id: ${CLIENT_ID}`);
  
  // Kembalikan data yang akan digunakan oleh VUs.
  return { requestId: requestId, clientId: CLIENT_ID };
}

// -- Main Test Logic --
// Fungsi ini dijalankan berulang kali oleh setiap Virtual User (VU).
export default function (data) {
  const requestId = data.requestId;
  const bankB_BaseUrl = `http://localhost:5000/kyc-requests/${requestId}`;

  // VU akan menjalankan langkah-langkah berikut dalam satu grup "Reuse KYC Workflow".
  group('Reuse KYC Workflow', function () {
    // Langkah 1: Membayar 'share' sebagai Bank Kedua.
    const payRes = http.post(`${bankB_BaseUrl}/pay`, JSON.stringify({}), {
      headers: { 'Content-Type': 'application/json' },
    });

    check(payRes, {
      'Step 1: Payment was successful (status 200)': (r) => r.status === 200,
    });
    
    // Hanya melanjutkan jika pembayaran berhasil.
    if(payRes.status !== 200) {
        console.error(`Payment failed for VU ${__VU}, iteration ${__ITER}. Aborting iteration.`);
        return; // Hentikan iterasi ini jika pembayaran gagal.
    }
    
    sleep(1); // Jeda 1 detik untuk mensimulasikan waktu berpikir.

    // Langkah 2: Mengambil, mendekripsi, dan memverifikasi data.
    const verifyRes = http.post(`${bankB_BaseUrl}/fetch-and-verify-reuse`, JSON.stringify({}), {
      headers: { 'Content-Type': 'application/json' },
    });

    check(verifyRes, {
      'Step 2: Verification was successful (status 200)': (r) => r.status === 200,
      'Step 2: Hash comparison matched': (r) => r.json('match') === true,
    });
    
    // Tambahkan data waktu eksekusi kustom.
    ExecutionTime.add(verifyRes.json('executionTimeMs'));
    
    // Catat jika terjadi ketidakcocokan hash.
    if (verifyRes.json('match') === false) {
        HashMismatchRate.add(1);
    } else {
        HashMismatchRate.add(0);
    }
  });

  sleep(2); // Jeda 2 detik antara setiap siklus workflow per VU.
}
