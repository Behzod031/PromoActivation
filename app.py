import os
from flask import Flask, render_template, request, jsonify
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime, timedelta
import uuid

app = Flask(__name__)

# Настройка Google Sheets
scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
creds = ServiceAccountCredentials.from_json_keyfile_name("google-key.json", scope)
client = gspread.authorize(creds)

sheet_data = client.open("PromoActivation").worksheet("Данные")
sheet_reference = client.open("PromoActivation").worksheet("Справочник")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/register_participation", methods=["POST"])
def register_participation():
    data = request.get_json()
    client_id = data.get("client_id")

    # Проверяем, есть ли уже такой client_id в таблице
    all_data = sheet_data.get_all_values()
    for i, row in enumerate(all_data[1:], start=2):
        if row[0] == client_id:
            participation_date = datetime.strptime(row[1], '%Y-%m-%d %H:%M:%S')
            days_passed = (datetime.now() - participation_date).days

            if row[2] == "" and days_passed >= 7:
                sheet_data.delete_row(i)
                break
            else:
                return jsonify({
                    "status": "already_registered",
                    "client_id": client_id,
                    "date": row[1],
                    "code": row[2]  # Возвращаем код, если он активирован
                })

    # Регистрируем нового клиента
    client_id = str(uuid.uuid4()) if not client_id else client_id
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    sheet_data.append_row([client_id, now, "", ""])
    return jsonify({
        "status": "registered",
        "client_id": client_id,
        "date": now,
        "code": ""
    })

@app.route("/check_code", methods=["POST"])
def check_code():
    data = request.get_json()
    input_code = data.get("code", "").strip()
    client_id = data.get("client_id", "").strip()

    all_data = sheet_data.get_all_values()
    for i, row in enumerate(all_data[1:], start=2):
        if row[0] == client_id:
            sheet_data.update_cell(i, 3, input_code)
            sheet_data.update_cell(i, 4, datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
            return jsonify({"status": "success"})

    return jsonify({"status": "error", "message": "Не найден client_id или срок истёк"})

if __name__ == "__main__":
    app.run(debug=False,host='0.0.0.0',port=1231)
