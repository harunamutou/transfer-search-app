document.getElementById('fareForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const from = document.getElementById('from').value;
    const to = document.getElementById('to').value;
    const via = document.getElementById('via').value.split(',').map(s => s.trim()).filter(s => s);

    const query = new URLSearchParams({ from, to, via: via.join(',') });
    const res = await fetch(`/fare?${query.toString()}`);
    const data = await res.json();

    const div = document.getElementById('result');
    if (data.success) {
        div.innerHTML = data.routes.map(r => `${r.path.join(' → ')} : ${r.fare}円`).join('<br>');
    } else {
        div.innerHTML = `Error ${data.error}: ${data.message}`;
    }
});
