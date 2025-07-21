// resultados.js (Updated Content)
document.addEventListener('DOMContentLoaded', async () => {
    const resultadoModelo = document.getElementById('ResultadoModelo');
    const resultadoProductividad = document.getElementById('ResultadoProductividad');
    const resultadoNPI = document.getElementById('ResultadoNPI');
    const resultadoYield = document.getElementById('ResultadoYield');
    const resultadoOEE = document.getElementById('ResultadoOEE');
    const resultadoMaquinas = document.getElementById('ResultadoMaquinas'); // New element
    const generarPDFBtn = document.getElementById('generarPDF');
    const regresarBtn = document.getElementById('regresarBtn');
    
    // Cargar datos del formulario
    try {
        const formResponses = await window.getAllDataFromIndexedDB(window.STORE_FORM_ADICIONAL);
        if (formResponses && formResponses.length > 0) {
            const latestResponse = formResponses[0];
            resultadoModelo.textContent = latestResponse.Cambiomodelo.toFixed(2);
            resultadoNPI.textContent = latestResponse.Cambioxdia.toFixed(2);
            resultadoYield.textContent = latestResponse.Cambioyi.toFixed(2);
            
            // Placeholder for future calculations
            resultadoProductividad.textContent = '87.2%';
            resultadoOEE.textContent = '82.6%';
        }
    } catch (error) {
        console.error("Error al cargar datos:", error);
    }
    
    // Cargar gráfico de demanda y calcular máquinas necesarias
    try {
        const demandaData = await window.getAllDataFromIndexedDB(window.STORE_DEMANDA);
        const graficaCanvas = document.getElementById('grafica'); // Get the canvas element

        if (demandaData && demandaData.length > 0) {
            // Aggregate demand data by month for the chart
            const monthlyDemand = {};
            let totalModelsDemand = 0; // To calculate total models for machine calculation

            demandaData.forEach(row => {
                const month = row['Mes'] || 'Desconocido'; // Assuming a 'Mes' column
                const models = parseFloat(row['Cantidad'] || row['Modelos'] || 0); // Assuming 'Cantidad' or 'Modelos' column
                if (!isNaN(models)) {
                    monthlyDemand[month] = (monthlyDemand[month] || 0) + models;
                    totalModelsDemand += models; // Accumulate total models
                }
            });

            const etiquetas = Object.keys(monthlyDemand);
            const dataValues = Object.values(monthlyDemand);

            // Calculate machines needed
            const maquinasNecesarias = Math.ceil(totalModelsDemand / 100); // 1 machine per 100 units
            resultadoMaquinas.textContent = maquinasNecesarias; // Display machines needed

            // Chart.js configuration
            new Chart(graficaCanvas, {
                type: 'bar',
                data: {
                    labels: etiquetas,
                    datasets: [{
                        label: "Demanda Total por Mes",
                        data: dataValues,
                        backgroundColor: "rgba(17, 1, 71, 0.55)",
                        borderColor: "#010036",
                        borderWidth: 1,
                    }],
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Modelos'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Periodo'
                            }
                        }
                    },
                    plugins: {
                        datalabels: {
                            anchor: 'end',
                            align: 'start',
                            offset: -10,
                            formatter: (value) => value.toFixed(0)
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error("Error al cargar gráfico o calcular máquinas:", error);
    }
    
    // Generar PDF
    generarPDFBtn.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const contenedor = document.querySelector('.container');
        
        html2canvas(contenedor).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const doc = new jsPDF();
            const imgProps = doc.getImageProperties(imgData);
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            doc.save(`reporte_scc_${new Date().toISOString().slice(0,10)}.pdf`);
        });
    });
    
    // Regresar al inicio y borrar datos
    regresarBtn.addEventListener('click', async () => {
        try {
            await window.clearObjectStore(window.STORE_DEMANDA);
            await window.clearObjectStore(window.STORE_CAPACIDAD);
            await window.clearObjectStore(window.STORE_FORM_ADICIONAL);
            window.location.href = './index.html';
        } catch (error) {
            console.error("Error al borrar datos:", error);
        }
    });
});