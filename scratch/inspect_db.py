import sqlite3
conn = sqlite3.connect('mldraft.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print('TABLES:', tables)
for t in tables:
    t_name = t[0]
    cursor.execute(f"PRAGMA table_info({t_name})")
    print(f"Table info for {t_name}:", cursor.fetchall())
