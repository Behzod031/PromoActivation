from flask import Flask, render_template, request
import gspread
from google.oauth2.service_account import Credentials
from datetime import datetime

app = Flask(__name__)

SERVICE_ACCOUNT_FILE = r"C:\Users\XS-NB-OP\PycharmProjects\land_chet_EL\credentials.json"
SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]
creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
client = gspread.authorize(creds)

spreadsheet = client.open("Xonsaroy_Online_Chat")
worksheet = spreadsheet.worksheet("DV360")  # Сохраняем заявки только в этот лист

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        name = request.form.get('name')
        phone = request.form.get('phone')
        city = request.form.get('city')  # Или 'country', если у тебя поле так называется
        date = datetime.now().strftime('%Y-%m-%d')  # Формат даты: ГГГГ-ММ-ДД

        worksheet.append_row([
            name,
            phone,
            city,
            date
        ])

        # Передаём utm для ссылки в Telegram
        return render_template('telegram.html', utm='ads')
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=1231)
