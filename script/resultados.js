document.addEventListener('DOMContentLoaded', async () => {
    const graficaCanvas = document.querySelector('#grafica');
    const mensajeParrafo = document.getElementById('mensaje'); // Usar el ID existente 'mensaje'
    const generarPDFBtn = document.getElementById('generarPDF');

    // Referencias a los TDs de la tabla
    const resultadoModelo = document.getElementById('ResultadoModelo');
    const resultadoProductividad = document.getElementById('ResultadoProductividad');
    const resultadoNPI = document.getElementById('ResultadoNPI');
    const resultadoYield = document.getElementById('ResultadoYield');
    const resultadoOEE = document.getElementById('ResultadoOEE');

    let myChartInstance = null; // Para almacenar la instancia del gráfico

    // Función para cargar y mostrar datos en la tabla de resultados
    async function loadTableData() {
        mensajeParrafo.textContent = 'Cargando datos adicionales...';
        try {
            // Obtener las respuestas del último formulario adicional
            const formResponses = await window.getAllDataFromIndexedDB(window.STORE_FORM_ADICIONAL);

            if (formResponses && formResponses.length > 0) {
                // Tomar la última respuesta (asumiendo que es la más reciente)
                const latestResponse = formResponses[formResponses.length - 1];

                // Asignar los valores a los TDs de la tabla
                resultadoModelo.textContent = latestResponse.Cambiomodelo !== undefined ? latestResponse.Cambiomodelo.toFixed(2) : 'N/A';
                resultadoNPI.textContent = latestResponse.Cambioxdia !== undefined ? latestResponse.Cambioxdia.toFixed(2) : 'N/A';
                // Formatear YIELD a porcentaje
                resultadoYield.textContent = (latestResponse.YI !== undefined && latestResponse.YI !== null) ? `${(latestResponse.YI * 100).toFixed(2)}%` : 'N/A';

                // *** Tus cálculos de Productividad y OEE van aquí ***
                // Ejemplo simple usando los valores ya parseados del formulario:
                const totalHorasTurnos = latestResponse.turno1Hrs + latestResponse.turno2Hrs + latestResponse.turno3Hrs;
                const horasNPI = latestResponse.Xdia; // Horas NPI por día
                const yieldActual = latestResponse.YI; // Ya es un decimal, ej. 0.95

                // Ejemplo de cálculo para productividad (ajusta a tu lógica real)
                // Esto es solo un placeholder, necesitas tu fórmula real
                let productividadCalculada = (totalHorasTurnos > 0) ? (totalHorasTurnos * 10 / 24).toFixed(2) : '0'; // Ejemplo simple y arbitrario

                // Ejemplo de cálculo para OEE (ajusta a tu lógica real)
                // OEE = Disponibilidad * Rendimiento * Calidad
                // Necesitas definir cómo se calculan Disponibilidad, Rendimiento y Calidad.
                // Usando valores del formulario como placeholders:
                let oeeCalculado = (yieldActual * (productividadCalculada / 100)).toFixed(2); // Ejemplo arbitrario

                resultadoProductividad.textContent = `${productividadCalculada}%`;
                resultadoOEE.textContent = `${oeeCalculado}%`;

                mensajeParrafo.textContent = 'Datos adicionales cargados y resultados calculados. ✅';
            } else {
                mensajeParrafo.textContent = 'No se encontraron datos adicionales del formulario. ❌';
            }
        } catch (error) {
            console.error('Error al cargar datos adicionales:', error);
            mensajeParrafo.textContent = `Error al cargar datos adicionales: ${error.message} ❌`;
        }

        // Aqui se pondra los resultados de la tabla, unidos a las variables de la tabla, tener relacion
        try{
            const formResponses = await window.getAllDataFromIndexedDB(window.STORE_FORM_ADICIONAL);
            let latestResponse = null;
            if(formResponses && formResponses.length > 0){
                latestResponse = formResponses[formResponses.length - 1];
                resultadoModelo.textContent= latestResponse.Cambiomodelo?.toFixed(2) || 'N/A';
                resultadoNPI.textContent = latestResponse.Cambioxdia?.toFixed(2) || 'N

            }
        }
    }


    // Función para cargar y graficar la demanda
    async function loadDemandaGraph() {
        mensajeParrafo.textContent = 'Cargando datos de demanda para graficar...';
        try {
            const demandaData = await window.getAllDataFromIndexedDB(window.STORE_DEMANDA);

            if (!demandaData || demandaData.length === 0) {
                mensajeParrafo.textContent = 'No hay datos de demanda disponibles para graficar. Por favor, sube un archivo Excel en la página principal.';
                if (myChartInstance) {
                    myChartInstance.destroy(); // Destruye el gráfico si no hay datos
                    myChartInstance = null;
                }
                return;
            }

            // Asume que la columna 'Periodo' contiene las etiquetas X y 'ValorDemanda' el valor Y
            // ¡AJUSTA 'Periodo' y 'ValorDemanda' con los nombres EXACTOS de tus columnas en la pestaña 'Demanda' del Excel!
            const etiquetas = demandaData.map(d => d.Periodo); // Reemplaza 'Periodo' con el nombre real de tu columna de períodos
            const datosValores = demandaData.map(d => parseFloat(d.ValorDemanda)); // Reemplaza 'ValorDemanda' con el nombre real de tu columna de valores de demanda

            // Filtrar cualquier valor NaN (Not-a-Number) que pueda surgir de la conversión
            const etiquetasFiltradas = etiquetas.filter((_, i) => !isNaN(datosValores[i]));
            const valoresFiltrados = datosValores.filter(val => !isNaN(val));

            if (myChartInstance) {
                myChartInstance.destroy(); // Destruye la instancia anterior del gráfico si existe
            }

            // Registrar el plugin de datalabels globalmente
            Chart.register(ChartDataLabels);

            myChartInstance = new Chart(graficaCanvas, {
                type: 'bar', // Tu tipo de gráfico original
                data: {
                    labels: etiquetasFiltradas,
                    datasets: [{
                        label: "Demanda",
                        data: valoresFiltrados,
                        backgroundColor: "rgba(17, 1, 71, 0.55)", // Tu color original
                        borderColor: "#010036", // Tu color original
                        borderWidth: 1,
                    }],
                },
                options: {
                    scales: {
                        y: { // Nuevo API de Chart.js 3.x+
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Unidades / Cantidad' // Título del eje Y
                            }
                        },
                        x: {
                             title: {
                                display: true,
                                text: 'Periodo' // Título del eje X
                            }
                        }
                    },
                    plugins: {
                        datalabels: { // Configuración del plugin de datalabels
                            anchor: 'end',
                            align: 'start',
                            offset: -10,
                            formatter: (value) => value.toFixed(0), // Formatea los valores sin decimales para demanda
                            color: 'black'
                        }
                    },
                    responsive: true,
                    maintainAspectRatio: false // Permite que el gráfico ajuste su tamaño al contenedor
                }
            });
            mensajeParrafo.textContent = 'Gráfico de Demanda cargado. ✅';

        } catch (error) {
            console.error('Error al cargar y graficar datos de demanda:', error);
            mensajeParrafo.textContent = `Error al cargar gráfico: ${error.message} ❌`;
        }
    }

    // --- Lógica para descargar PDF ---
    generarPDFBtn.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const contenedor = document.querySelector('.contenedor'); // El contenedor principal que quieres capturar

        // Opciones adicionales para html2canvas si la captura no es correcta
        const html2canvasOptions = {
            useCORS: true, // Habilita la carga de imágenes de otros dominios (si aplica)
            scale: 2, // Aumenta la resolución de la captura para mejor calidad en PDF
            logging: true, // Habilita logs para depuración
        };

        html2canvas(contenedor, html2canvasOptions).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const doc = new jsPDF();

            const imgProps = doc.getImageProperties(imgData);
            const pdfWidth = doc.internal.pageSize.getWidth(); // Ancho de la página del PDF
            // Calcula la altura proporcionalmente para mantener la relación de aspecto de la imagen
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            // Añade la imagen al PDF
            doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            // Genera el nombre del archivo con la fecha
            const fecha = new Date();
            const fechaFormateada = fecha.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }).replace(/\//g, '-');

            doc.save(`bitacora_${fechaFormateada}.pdf`);
        }).catch(error => {
            console.error("Error al generar el PDF:", error);
            mensajeParrafo.textContent = "No se pudo generar el PDF. Asegúrate de estar cargando el sitio desde un servidor local. ❌";
        });
    });
    const regresarBtn = document.getElementById('regresarBtn');

    regresarBtn.addEventListener('click',async () => {
        try {
            await window.clearObjectStore(window.STORE_DEMANDA);
            await window.clearObjectStore(window.STORE_CAPACIDAD);
            await window.clearObjectStore(window.STORE_FORM_ADICIONAL);
            console.log('Datos Borrados de manera exitosa');
            window.location.href = './index.html';
            
        } catch (error) { 
            console.log('Error de borrar datos', error);
            mensajeParrafo.textContent = `Error al borrar datos: ${error.message} ❌`;
            
        }
    });

    // Cargar los datos de la tabla y el gráfico de demanda cuando la página de resultados se carga
    await loadTableData();
    await loadDemandaGraph();
});