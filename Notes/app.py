from flask import Flask, render_template, request, redirect, session, jsonify
from supabase_client import supabase
import os
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
app.secret_key = "love_secret_key_sadqua_2025"


# Configure Gemini API
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')


def get_gemini_summary(content):
    """Generate summary using Gemini API"""
    if not GEMINI_API_KEY:
        return None
    
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        
        model = genai.GenerativeModel('gemini-2.5-flash-lite')
        
        prompt = f"""Please provide a concise and beautiful summary of the following note. 
        Keep it warm, friendly, and capture the essence in 2-3 sentences:


        {content}


        Summary:"""
        
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return None



@app.route('/')
def index():
    """Redirect to login page"""
    if 'user' in session:
        return redirect('/dashboard')
    return redirect('/login')



@app.route('/login', methods=['GET', 'POST'])
def login():
    """Login page"""
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        if not email or not password:
            return render_template('login.html', error="Please enter email and password")
        
        try:
            user = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })


            session['user'] = user.user.id
            return redirect('/dashboard')
        except Exception as e:
            print(f"Login error: {e}")
            return render_template('login.html', error="Invalid email or password")
    
    # If already logged in, go to dashboard
    if 'user' in session:
        return redirect('/dashboard')
    
    return render_template('login.html')



@app.route('/dashboard')
def dashboard():
    """Dashboard page"""
    if 'user' not in session:
        return redirect('/login')
    
    user_id = session.get('user')
    
    try:
        # Get folders
        folders = (
            supabase
            .table('folders')
            .select('*')
            .eq('user_id', user_id)
            .order('created_at', desc=False)
            .execute()
            .data
        )
    except Exception as e:
        print(f"Error fetching folders: {e}")
        folders = []
    
    return render_template('dashboard.html', folders=folders)



@app.route('/create_folder', methods=['POST'])
def create_folder():
    """Create a new folder"""
    print("Create folder route called")  # Debug log
    
    if 'user' not in session:
        print("User not in session")  # Debug log
        return redirect('/login')
    
    name = request.form.get('name')
    print(f"Folder name: {name}")  # Debug log
    
    if not name:
        print("No folder name provided")  # Debug log
        return redirect('/dashboard')
    
    try:
        result = supabase.table('folders').insert({
            'name': name,
            'user_id': session['user']
        }).execute()
        print(f"Folder created: {result}")  # Debug log
    except Exception as e:
        print(f"Error creating folder: {e}")  # Debug log
    
    return redirect('/dashboard')



@app.route('/get_notes/<folder_id>')
def get_notes(folder_id):
    """Get all notes in a folder"""
    if 'user' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        notes = (
            supabase
            .table('notes')
            .select('*')
            .eq('folder_id', folder_id)
            .eq('user_id', session['user'])
            .order('created_at', desc=True)
            .execute()
            .data
        )
        
        return jsonify(notes)
    except Exception as e:
        print(f"Error fetching notes: {e}")
        return jsonify({'error': 'Failed to fetch notes'}), 500



@app.route('/create_note', methods=['POST'])
def create_note():
    """Create a new note"""
    if 'user' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        data = request.json
        data['user_id'] = session['user']
        
        result = supabase.table('notes').insert(data).execute()
        return jsonify({'status': 'success', 'data': result.data})
    except Exception as e:
        print(f"Error creating note: {e}")
        return jsonify({'error': 'Failed to create note'}), 500



@app.route('/update_note/<note_id>', methods=['PUT'])
def update_note(note_id):
    """Update an existing note"""
    if 'user' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        data = request.json
        result = (
            supabase
            .table('notes')
            .update(data)
            .eq('id', note_id)
            .eq('user_id', session['user'])
            .execute()
        )
        
        return jsonify({'status': 'success', 'data': result.data})
    except Exception as e:
        print(f"Error updating note: {e}")
        return jsonify({'error': 'Failed to update note'}), 500



@app.route('/delete_note/<note_id>', methods=['DELETE'])
def delete_note(note_id):
    """Delete a note"""
    if 'user' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        supabase.table('notes').delete().eq('id', note_id).eq('user_id', session['user']).execute()
        return jsonify({'status': 'success'})
    except Exception as e:
        print(f"Error deleting note: {e}")
        return jsonify({'error': 'Failed to delete note'}), 500



@app.route('/delete_folder/<folder_id>', methods=['DELETE'])
def delete_folder(folder_id):
    """Delete a folder and all its notes"""
    if 'user' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        # Delete all notes in folder first
        supabase.table('notes').delete().eq('folder_id', folder_id).eq('user_id', session['user']).execute()
        
        # Delete folder
        supabase.table('folders').delete().eq('id', folder_id).eq('user_id', session['user']).execute()
        
        return jsonify({'status': 'success'})
    except Exception as e:
        print(f"Error deleting folder: {e}")
        return jsonify({'error': 'Failed to delete folder'}), 500



@app.route('/summarize', methods=['POST'])
def summarize():
    """Generate AI summary of note content"""
    if 'user' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json
    content = data.get('content', '')
    
    if not content.strip():
        return jsonify({'error': 'No content provided'}), 400
    
    if not GEMINI_API_KEY:
        return jsonify({'error': 'AI service not configured. Please add GEMINI_API_KEY to environment variables.'}), 503
    
    try:
        summary = get_gemini_summary(content)
        
        if summary:
            return jsonify({'summary': summary, 'status': 'success'})
        else:
            return jsonify({'error': 'Failed to generate summary'}), 500
    
    except Exception as e:
        print(f"Error in summarize route: {e}")
        return jsonify({'error': 'Failed to generate summary'}), 500



@app.route('/logout')
def logout():
    """Logout user"""
    session.pop('user', None)
    return redirect('/login')



@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'app': 'Sadqua Love Notes'}), 200



# Error handlers
@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors"""
    return redirect('/login')



@app.errorhandler(500)
def server_error(e):
    """Handle 500 errors"""
    print(f"Server error: {e}")
    return "Internal server error", 500



# For Render deployment
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(host='0.0.0.0', port=port, debug=debug)
