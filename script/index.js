function CargarDemanda() {
            document.getElementById('fileInput').click();
            document.getElementById('fileInput').addEventListener('change', function(event) {
                const file = event.target.files[0];
                if (file) {
                    document.getElementById('mensaje').textContent = 'Archivo seleccionado: ' + file.name;
                } else {
                    document.getElementById('mensaje').textContent = 'No se seleccionó ningún archivo.';
                }
            });
        }