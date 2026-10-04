# Migration: SQL to JSON-based Storage

## Summary

Backend telah berhasil diubah dari SQL-based (SQLAlchemy) menjadi **JSON-based storage system**.

## Perubahan Utama

### 1. Storage System

- ❌ **Sebelumnya**: SQLAlchemy + MySQL/SQLite
- ✅ **Sekarang**: JSON files (`data/users.json` dan `data/orders.json`)

### 2. Dependencies yang Dihapus

```diff
- Flask-SQLAlchemy==3.1.1
- Flask-Migrate==4.0.5
- PyMySQL==1.1.0
- cryptography==41.0.7
```

### 3. File yang Diubah

#### Backend Core

- `database/db.py` - JSONStorage class menggantikan SQLAlchemy
- `models/user.py` - User model dengan JSON operations
- `models/order.py` - Order model dengan JSON operations
- `app.py` - Menghapus SQLAlchemy initialization
- `config/config.py` - Menghapus database URI config

#### Routes (Updated untuk JSON)

- `routes/auth_routes.py` - User.get_by_email(), User.save()
- `routes/customer_routes.py` - Order.get_by_customer(), Order.save()
- `routes/driver_routes.py` - Order.get_all(), filtering manual
- `routes/admin_routes.py` - Aggregasi manual untuk statistics

#### Middleware

- `middleware/auth.py` - User.get_by_id()

#### Configuration

- `requirements.txt` - Dihapus SQL dependencies
- `.env.example` - Mengganti DATABASE_URI dengan DATA_DIR
- `.gitignore` - Tracking data/\*.json

### 4. Struktur Data Baru

```
backend/
├── data/                  # NEW! JSON storage
│   ├── users.json        # User data
│   ├── orders.json       # Order data
│   └── .gitkeep
├── database/
│   └── db.py             # JSONStorage class
├── models/
│   ├── user.py           # JSON-based User model
│   └── order.py          # JSON-based Order model
└── ...
```

## Keuntungan

✅ **No Database Setup** - Langsung jalankan tanpa install MySQL/PostgreSQL  
✅ **Portable** - Copy folder `data/` untuk backup/restore  
✅ **Easy to Read** - Data dalam format JSON yang mudah dibaca  
✅ **Simple Deployment** - Deploy ke server mana saja tanpa setup DB  
✅ **Git-friendly** - Bisa track changes di data (optional)  
✅ **Fast Development** - Tidak perlu migration scripts

## Cara Menggunakan

### Setup (Pertama Kali)

```bash
cd backend
pip install -r requirements.txt
python app.py
```

File JSON akan otomatis dibuat di `data/` folder.

### Backup Data

```bash
# Backup
cp -r data/ backup_$(date +%Y%m%d)/

# Restore
cp -r backup_20250118/ data/
```

### Reset Data

```bash
# Hapus semua data
echo "[]" > data/users.json
echo "[]" > data/orders.json
```

## API Compatibility

✅ **Semua API endpoint tetap sama**  
✅ **Response format tetap sama**  
✅ **Authentication tetap menggunakan JWT**  
✅ **Frontend tidak perlu diubah**

## Batasan

⚠️ **Concurrency** - Tidak cocok untuk high-traffic concurrent writes  
⚠️ **Scale** - Cocok untuk small-medium apps (< 10,000 records)  
⚠️ **Search** - Filtering/sorting lebih lambat vs indexed SQL  
⚠️ **Relations** - Manual join, tidak seperti SQL foreign keys

Untuk production dengan traffic tinggi, pertimbangkan kembali ke SQL database atau gunakan MongoDB.

## Testing

Semua fitur tetap berfungsi:

- ✅ User registration & login
- ✅ Customer create & view orders
- ✅ Driver view & accept orders
- ✅ Admin dashboard & statistics
- ✅ Price calculation

## Next Steps

1. ✅ Install dependencies baru: `pip install -r requirements.txt`
2. ✅ Jalankan server: `python app.py`
3. ✅ Test API endpoints
4. ✅ Test frontend integration
5. 📝 Buat sample data untuk testing (optional)

---

**Migration Date**: November 18, 2025  
**Migration Type**: SQL → JSON  
**Status**: ✅ Complete
