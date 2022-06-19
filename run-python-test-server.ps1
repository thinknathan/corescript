start-process -FilePath 'C:\Program Files (x86)\BraveSoftware\Brave-Browser\Application\brave.exe' -ArgumentList 'http://localhost:8000?test'
cd www
python -m http.server
