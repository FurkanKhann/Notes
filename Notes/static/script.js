// Dark mode toggle
function toggleDark() {
  document.body.classList.toggle('dark');
}

// Heart animation on save
function showHearts() {
  for (let i = 0; i < 10; i++) {
    const heart = document.createElement('div');
    heart.className = 'heart';
    heart.style.left = Math.random() * 100 + 'vw';
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 2000);
  }
}

function saveNote() {
  fetch('/create_note', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      title:document.getElementById('title').value,
      content:document.getElementById('content').value,
      color:document.getElementById('color').value,
      font:document.getElementById('font').value,
      memory_date: new Date().toISOString().split('T')[0]
    })
  }).then(() => showHearts());
}

function saveNote() {
  fetch('/create_note', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      title:document.getElementById('title').value,
      content:document.getElementById('content').value,
      color:document.getElementById('color').value,
      font:document.getElementById('font').value
    })
  })
}