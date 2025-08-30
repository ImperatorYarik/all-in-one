from flask import Flask, render_template
from flask_admin import Admin

app = Flask(__name__)


app.config['FLASK_ADMIN_SWATCH'] = 'cerulean'

admin = Admin(app, name='microblog', template_mode='bootstrap3')


# @app.route('/')
# def index():
#     return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)