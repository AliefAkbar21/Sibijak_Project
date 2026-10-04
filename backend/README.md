# Pengangkut Sampah - Backend API

Backend API untuk aplikasi Pengangkut Sampah menggunakan Flask dengan **JSON-based storage**.

## Storage System

Aplikasi ini menggunakan **JSON files** untuk menyimpan data, bukan database SQL. Data disimpan dalam folder `data/`:

- `data/users.json` - Data pengguna
- `data/orders.json` - Data pesanan

Keuntungan JSON-based storage:

- ✅ Tidak perlu setup database
- ✅ Mudah di-deploy
- ✅ Portable dan mudah di-backup
- ✅ Data dalam format yang mudah dibaca
- ✅ Cocok untuk development dan small-medium scale apps

## Setup

1. Install Python dependencies:

```bash
pip install -r requirements.txt
```

2. Setup environment variables:

```bash
cp .env.example .env
# Edit .env dengan konfigurasi Anda
```

3. Run the application:

```bash
python app.py
```

Server akan berjalan di `http://localhost:5000`

**Tidak perlu setup database!** File JSON akan otomatis dibuat saat aplikasi pertama kali dijalankan.

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register user baru
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Customer

- `POST /api/customer/orders` - Buat order baru
- `GET /api/customer/orders` - List order customer
- `GET /api/customer/orders/<id>` - Detail order
- `POST /api/customer/calculate-price` - Hitung harga

### Driver

- `GET /api/driver/orders` - List order available (by session)
- `GET /api/driver/orders/assigned` - List order yang assigned
- `POST /api/driver/orders/<id>/accept` - Accept order
- `POST /api/driver/orders/<id>/start` - Start pickup
- `POST /api/driver/orders/<id>/complete` - Complete order

### Admin

- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/users` - List all users
- `GET /api/admin/orders` - List all orders

## Data Structure

### Users (data/users.json)

```json
[
  {
    "id": 1,
    "email": "user@example.com",
    "password_hash": "hashed_password",
    "name": "John Doe",
    "role": "customer|driver|admin",
    "phone": "08123456789",
    "address": "Jakarta",
    "is_verified": false,
    "is_active": true,
    "session_preference": "morning|afternoon|both",
    "vehicle_number": "B 1234 XYZ",
    "created_at": "2025-01-01T00:00:00",
    "updated_at": "2025-01-01T00:00:00"
  }
]
```

### Orders (data/orders.json)

```json
[
  {
    "id": 1,
    "customer_id": 1,
    "driver_id": 2,
    "name": "John Doe",
    "address": "Jl. Example No. 123",
    "latitude": -6.2088,
    "longitude": 106.8456,
    "waste_type": "paper|glass|organic|plastic",
    "weight": 5.5,
    "base_price": 55000,
    "admin_fee": 550,
    "additional_fee": 0,
    "total_price": 55550,
    "pickup_session": "morning|afternoon",
    "pickup_date": "2025-01-15",
    "pickup_time": null,
    "status": "pending|assigned|in_progress|completed|cancelled",
    "notes": "Optional notes",
    "created_at": "2025-01-01T00:00:00",
    "updated_at": "2025-01-01T00:00:00",
    "completed_at": null
  }
]
```

## Pricing Logic

- Base: 10,000 IDR per kg
- Admin fee: 1% of base price
- Additional fee: 5% if weight > 10kg

## Tech Stack

- **Flask** - Web framework
- **Flask-JWT-Extended** - Authentication
- **Flask-CORS** - CORS support
- **JSON** - Data storage (no SQL database!)
- **Werkzeug** - Password hashing

## Backup & Restore

Untuk backup data, cukup copy folder `data/`:

```bash
# Backup
cp -r data/ data_backup_$(date +%Y%m%d)/

# Restore
cp -r data_backup_20250118/ data/
```

## Migration from SQL

Aplikasi ini sebelumnya menggunakan SQLAlchemy, tapi telah dikonversi ke JSON-based storage untuk kemudahan deployment dan portability.
