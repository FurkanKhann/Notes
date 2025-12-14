from flask import Flask, render_template, request, redirect, session, jsonify
from supabase_client import supabase

app = Flask(__name__)
app.secret_key = "love_secret_key"


@app.route('/', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        user = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })

        session['user'] = user.user.id
        return redirect('/dashboard')

    return render_template('login.html')


@app.route('/dashboard')
def dashboard():
    user_id = session.get('user')
    folders = (
        supabase
        .table('folders')
        .select('*')
        .eq('user_id', user_id)
        .execute()
        .data
    )
    return render_template('dashboard.html', folders=folders)


@app.route('/create_folder', methods=['POST'])
def create_folder():
    name = request.form['name']
    supabase.table('folders').insert({
        'name': name,
        'user_id': session['user']
    }).execute()

    return redirect('/dashboard')


@app.route('/create_note', methods=['POST'])
def create_note():
    data = request.json
    supabase.table('notes').insert(data).execute()
    return jsonify({'status': 'success'})


if __name__ == '__main__':
    app.run(debug=True)
