# Pengangkut Sampah - Frontend

Frontend aplikasi Pengangkut Sampah menggunakan HTML, CSS, dan JavaScript.

## Struktur Folder

```
frontend/
├── index.html                 # Landing page
├── assets/
│   ├── css/                   # Stylesheet files
│   │   ├── style.css         # Global styles
│   │   ├── auth.css          # Auth pages styles
│   │   ├── dashboard.css     # Dashboard styles
│   │   └── landing.css       # Landing page styles
│   ├── js/                    # JavaScript files
│   │   ├── main.js           # Main JS
│   │   ├── api.js            # API calls
│   │   ├── auth.js           # Auth utilities
│   │   ├── login.js          # Login page
│   │   ├── signup.js         # Signup page
│   │   ├── customer-dashboard.js
│   │   ├── customer-order.js
│   │   └── driver-dashboard.js
│   ├── images/               # Image assets
│   └── icons/                # Icon assets
├── pages/
│   ├── auth/
│   │   ├── login.html
│   │   └── signup.html
│   ├── customer/
│   │   ├── dashboard.html
│   │   ├── order.html
│   │   ├── orders.html
│   │   └── profile.html
│   ├── driver/
│   │   ├── dashboard.html
│   │   ├── orders.html
│   │   ├── my-orders.html
│   │   └── profile.html
│   └── admin/
│       ├── dashboard.html
│       ├── users.html
│       └── orders.html
├── components/               # Reusable components
└── utils/                    # Utility functions
```

## Halaman yang Sudah Dibuat

### Authentication (2 halaman)

1. Login - `pages/auth/login.html`
2. Sign Up - `pages/auth/signup.html`

### Customer (4 halaman planned)

1. Dashboard - `pages/customer/dashboard.html` ✅
2. Buat Pesanan - `pages/customer/order.html` ✅
3. Daftar Pesanan - `pages/customer/orders.html` (belum dibuat)
4. Profil - `pages/customer/profile.html` (belum dibuat)

### Driver (4 halaman planned)

1. Dashboard - `pages/driver/dashboard.html` ✅
2. Daftar Pesanan - `pages/driver/orders.html` (belum dibuat)
3. Pesanan Saya - `pages/driver/my-orders.html` (belum dibuat)
4. Profil - `pages/driver/profile.html` (belum dibuat)

### Admin (3 halaman planned)

1. Dashboard - `pages/admin/dashboard.html` (belum dibuat)
2. Manajemen User - `pages/admin/users.html` (belum dibuat)
3. Manajemen Pesanan - `pages/admin/orders.html` (belum dibuat)

### Landing

1. Landing Page - `index.html` ✅

**Total: 14 halaman** (7 sudah dibuat, 7 belum)

## Fitur

### Customer

- ✅ Login & Sign up dengan validasi email
- ✅ Dashboard dengan statistik pesanan
- ✅ Fitur maps untuk menentukan lokasi (Leaflet)
- ✅ Form order dengan input lengkap
- ✅ Kalkulasi harga otomatis
- Daftar pesanan (belum dibuat)
- Profil user (belum dibuat)

### Driver

- ✅ Login dengan pilihan sesi (pagi/sore)
- ✅ Dashboard dengan pesanan tersedia
- ✅ Filter pesanan berdasarkan sesi
- ✅ Terima pesanan
- Mulai & selesaikan pesanan (belum dibuat)
- Profil user (belum dibuat)

## Cara Menjalankan

1. Pastikan backend sudah berjalan di `http://localhost:5000`

2. Buka `index.html` dengan browser atau gunakan live server:

   ```bash
   # Jika punya Python
   python -m http.server 8000

   # Atau gunakan VS Code Live Server extension
   ```

3. Akses di browser: `http://localhost:8000`

## Konfigurasi

API endpoint ada di `assets/js/api.js`:

```javascript
const API_BASE_URL = "http://localhost:5000/api";
```

## Dependencies

- **Leaflet** - untuk maps (via CDN)
- **Font Awesome** - untuk icons (optional)

## Next Steps

Untuk melengkapi aplikasi, perlu dibuat:

1. Customer Orders List Page
2. Customer Profile Page
3. Driver Orders List Page
4. Driver My Orders Page
5. Driver Profile Page
6. Admin Dashboard
7. Admin Users Management
8. Admin Orders Management
