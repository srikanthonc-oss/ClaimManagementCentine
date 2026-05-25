"""Fix Excel serial numbers in date columns across all reference tables."""
import sys
sys.path.insert(0, '.')
from app.db.pool import get_db
from datetime import datetime, timedelta


def excel_serial_to_date(serial_str):
    """Convert Excel serial number string to MM/DD/YYYY date string."""
    try:
        serial = int(float(serial_str))
        if serial > 40000 and serial < 50000:  # Valid Excel date range
            date = datetime(1899, 12, 30) + timedelta(days=serial)
            return date.strftime('%m/%d/%Y')
    except (ValueError, TypeError):
        pass
    return None


def fix_table(cur, table, columns):
    """Fix date columns in a table."""
    for col in columns:
        cur.execute(f"SELECT id, {col} FROM {table} WHERE {col} IS NOT NULL AND {col} != ''")
        rows = cur.fetchall()
        updated = 0
        for row_id, val in rows:
            if val and str(val).replace('.', '').isdigit():
                new_val = excel_serial_to_date(val)
                if new_val:
                    cur.execute(f"UPDATE {table} SET {col} = %s WHERE id = %s", (new_val, row_id))
                    updated += 1
        if updated > 0:
            print(f"  {table}.{col}: fixed {updated} rows")


def main():
    conn = get_db()
    cur = conn.cursor()

    print("Fixing Excel serial numbers in date columns...")

    # claim_header_detail.received_date
    fix_table(cur, "claim_header_detail", ["received_date"])

    # claim_detail_lines.start_date, end_date
    fix_table(cur, "claim_detail_lines", ["start_date", "end_date"])

    # claim_cob_history.effective_date, term_date
    fix_table(cur, "claim_cob_history", ["effective_date", "term_date"])

    conn.commit()
    cur.close()
    conn.close()
    print("Done!")


if __name__ == "__main__":
    main()
