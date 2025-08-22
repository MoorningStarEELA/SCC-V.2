document.addEventListener('DOMContentLoaded', async () => {
    const resultadoModelo = document.getElementById('ResultadoModelo');
    const resultadoProductividad = document.getElementById('ResultadoProductividad');
    const resultadoNPI = document.getElementById('ResultadoNPI');
    const resultadoYield = document.getElementById('ResultadoYield');
    const resultadoOEE = document.getElementById('ResultadoOEE');
    const generarPDFBtn = document.getElementById('generarPDF');
    const regresarBtn = document.getElementById('regresarBtn');
    const resultadoMaquinas = document.getElementById('ResultadoMaquinas');
    const ResultadoVariability = document.getElementById('Variability');
    
    let myChartInstance = null;
    let variability = 0;

    try {
        const formResponses = await window.getAllDataFromIndexedDB(window.STORE_FORM_ADICIONAL);

        if (formResponses && formResponses.length > 0) {
            const latestResponse = formResponses[0];
            console.log("Datos leídos de IndexedDB en resultados.js:", latestResponse);

            const cambioModelo = latestResponse.Cambiomodelo ?? 0;
            const cambioXdia = latestResponse.Xdia ?? 0;
            const cambioYi = latestResponse.Cambioyi ?? 0;
            const eficiencia = latestResponse.Eficiencia ?? 0;
            const oee = latestResponse.OEE ?? 0;
            variability = latestResponse.Variability ?? 0;

            resultadoModelo.textContent = cambioModelo.toFixed(2);
            resultadoNPI.textContent = cambioXdia.toFixed(2);
            resultadoYield.textContent = `${(cambioYi * 100).toFixed(2)}%`;
            resultadoProductividad.textContent = `${(eficiencia * 100).toFixed(2)}%`;
            resultadoOEE.textContent = `${(oee * 100).toFixed(2)}%`;
        } else {
            console.warn("No se encontraron datos en STORE_FORM_ADICIONAL.");
            resultadoModelo.textContent = 'N/A';
            resultadoNPI.textContent = 'N/A';
            resultadoYield.textContent = 'N/A';
            resultadoProductividad.textContent = 'N/A';
            resultadoOEE.textContent = 'N/A';
            resultadoMaquinas.textContent = 'N/A';
        }
    } catch (error) {
        console.error("Error al cargar datos del formulario:", error);
        resultadoModelo.textContent = 'Error';
        resultadoNPI.textContent = 'Error';
        resultadoYield.textContent = 'Error';
        resultadoProductividad.textContent = 'Error';
        resultadoOEE.textContent = 'Error';
        resultadoMaquinas.textContent = 'Error';
    }

    try {
        const demandaData = await window.getAllDataFromIndexedDB(window.STORE_DEMANDA);
        const capacidadData = await window.getAllDataFromIndexedDB(window.STORE_CAPACIDAD);

        function obtenerMeses() {
            const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            const fechaActual = new Date();
            const mesActual = fechaActual.getMonth();
            const mesesDinamicos = [];
            for (let i = 0; i < 12; i++) {
                const indiceMes = (mesActual + i) % 12;
                mesesDinamicos.push(meses[indiceMes]);
            }
            return mesesDinamicos;
        }

        if (demandaData && demandaData.length > 0 && capacidadData && capacidadData.length > 0) {
            const ctx = document.getElementById('grafica').getContext('2d');
            const meses = obtenerMeses();
            
            // Reestructurar los datos de demanda para facilitar el acceso por mes y modelo
            const demandaPorModeloYMes = {};
            demandaData.forEach(row => {
                 const modelo = row['Modelo']; // Asume que la columna se llama 'Modelo'
                 if (modelo) {
                     demandaPorModeloYMes[modelo] = row;
                 }
            });

            // *** LÓGICA DE CÁLCULO SEGÚN LAS FÓRMULAS PROPORCIONADAS ***
            const valoresGrafica = [];
            
            const mesIndexMap = {
                'Enero': 0, 'Febrero': 1, 'Marzo': 2, 'Abril': 3, 'Mayo': 4, 'Junio': 5,
                'Julio': 6, 'Agosto': 7, 'Septiembre': 8, 'Octubre': 9, 'Noviembre': 10, 'Diciembre': 11
            };

            meses.forEach(mes => {
                let sumaTotalValores = 0;
                
                // Iterar sobre cada modelo de capacidad
                capacidadData.forEach(filaCapacidad => {
                    const modelo = filaCapacidad['Modelo']; // Asume que la columna se llama 'Modelo'
                    const demandaDelMes = parseFloat(demandaPorModeloYMes[modelo]?.[mes] || '0');
                    const uph100 = parseFloat(filaCapacidad['UPH 100%']) || 0;
                    
                    const today = new Date();
                    const currentYear = today.getFullYear();
                    const monthIndex = mesIndexMap[mes];
                    const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();

                    if (demandaDelMes > 0 && uph100 > 0 && variability > 0 && daysInMonth > 0) {
                        // Paso 1: UPH100 / DemandaData * 60
                        const resultadoPaso1 = (uph100 / demandaDelMes) * 60;
                        
                        // Paso 2: resultadoPaso1 / variability / daysInMonth
                        const resultadoFinal = resultadoPaso1 / variability / daysInMonth;
                        
                        sumaTotalValores += resultadoFinal;
                    }
                });
                valoresGrafica.push(sumaTotalValores);
            });

            // *** FIN DE LA LÓGICA DE CÁLCULO ***

            const labels = meses;
            const maxValor = Math.max(...valoresGrafica);
            resultadoMaquinas.textContent = maxValor.toFixed(4); // Mostrar con más decimales

            if (myChartInstance) {
                myChartInstance.destroy();
            }

            myChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Resultado de la fórmula',
                        data: valoresGrafica,
                        backgroundColor: 'rgba(75, 192, 192, 0.5)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Valor Calculado'
                            },
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Mes'
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error("Error al cargar gráfico:", error);
    }
    
    generarPDFBtn.addEventListener('click', () => {
        const {
            jsPDF
        } = window.jspdf;
        const contenedor = document.querySelector('.container');

        html2canvas(contenedor).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const doc = new jsPDF();
            const imgProps = doc.getImageProperties(imgData);
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            doc.save(`reporte_scc_${new Date().toISOString().slice(0, 10)}.pdf`);
        });
    });

    regresarBtn.addEventListener('click', async () => {
        try {
            await window.clearObjectStore(window.STORE_DEMANDA);
            await window.clearObjectStore(window.STORE_CAPACIDAD);
            await window.clearObjectStore(window.STORE_FORM_ADICIONAL);
            await window.clearObjectStore(window.STORE_RESULTADO_GRAFICA);

            window.location.href = './index.html';
        } catch (error) {
            console.error('Error al borrar datos:', error);
        }
    });
});