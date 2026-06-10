import sqlite3
conn = sqlite3.connect('mldraft.db')
cursor = conn.cursor()
cursor.execute("SELECT id, name FROM heroes WHERE name LIKE 'Alice' OR name LIKE 'Freya'")
print(cursor.fetchall())
conn.close()
