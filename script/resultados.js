document.addEventListener('DOMContentLoaded', async () => {
    const resultadoModelo = document.getElementById('ResultadoModelo');
    const resultadoProductividad = document.getElementById('ResultadoProductividad');
    const resultadoNPI = document.getElementById('ResultadoNPI');
    const resultadoYield = document.getElementById('ResultadoYield');
    const resultadoOEE = document.getElementById('ResultadoOEE');
    const generarPDFBtn = document.getElementById('generarPDF');
    const regresarBtn = document.getElementById('regresarBtn');
    const resultadoMaquinas = document.getElementById('ResultadoMaquinas');
    const top10TableBody = document.getElementById('top10TableBody');
    
    let myChartInstance = null;
    let variability = 0;

    try {
        const formResponses = await window.getAllDataFromIndexedDB(window.STORE_FORM_ADICIONAL);
        if (formResponses && formResponses.length > 0) {
            const latestResponse = formResponses[0];
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
        const capacidadData = await window.getAllDataFromIndexedDB(window.STORE_INFORMACION);

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
            const meses = obtenerMeses();
            const modelosPorMaquinaTotalCalculado = {};
            let totalMaquinasGlobalCalculado = 0;

            // Log para debug: Revisa las claves de capacidadData y demandaData
            if (capacidadData.length > 0) {
                console.log("Claves del primer objeto de capacidadData:", Object.keys(capacidadData[0]));
            }
            if (demandaData.length > 0) {
                console.log("Claves del primer objeto de demandaData:", Object.keys(demandaData[0]));
            }

            // --- Lógica para calcular el Top 10 por Modelo ---
            capacidadData.forEach(filaCapacidad => {
                const modeloCapacidad = filaCapacidad['Ensamble (Número)']; // Nombre del modelo de la tabla de capacidad
                if (!modeloCapacidad) return; // Si no hay modelo, saltar

                let maquinasNecesariasParaEsteModelo = 0;

                // Buscar la demanda para este modelo en la tabla de demanda
                const filaDemandaParaModelo = demandaData.find(d => d['Ensamble (Número)'] === modeloCapacidad);

                if (filaDemandaParaModelo) {
                    meses.forEach(mes => {
                        const demandaDelMes = parseFloat((filaDemandaParaModelo[mes] || '0').toString().replace(/,/g, '').trim());
                        if (!isNaN(demandaDelMes) && demandaDelMes > 0) {
                            const today = new Date();
                            const currentYear = today.getFullYear();
                            const mesIndexMap = {
                                'Enero': 0, 'Febrero': 1, 'Marzo': 2, 'Abril': 3, 'Mayo': 4, 'Junio': 5,
                                'Julio': 6, 'Agosto': 7, 'Septiembre': 8, 'Octubre': 9, 'Noviembre': 10, 'Diciembre': 11
                            };
                            const monthIndex = mesIndexMap[mes];
                            const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
                            const Sabado3 = 1862;
                            const horasDisponibles = (variability - Sabado3) * 60;

                            const uphReal = parseFloat(filaCapacidad['UPH Real']) || 0;

                            if (uphReal > 0 && daysInMonth > 0 && horasDisponibles > 0) {
                                const resultado = (demandaDelMes / uphReal) * 60;
                                const horasnecesarias = resultado / horasDisponibles;
                                const maquinasTotales = horasnecesarias / daysInMonth;
                                maquinasNecesariasParaEsteModelo += maquinasTotales;
                            }
                        }
                    });
                }
                
                modelosPorMaquinaTotalCalculado[modeloCapacidad] = maquinasNecesariasParaEsteModelo;
                totalMaquinasGlobalCalculado += maquinasNecesariasParaEsteModelo;
            });

            // Ordenar y mostrar el Top 10
            const modelosOrdenados = Object.entries(modelosPorMaquinaTotalCalculado)
                .map(([modelo, maquinas]) => ({
                    modelo,
                    maquinas,
                    porcentaje: (totalMaquinasGlobalCalculado > 0) ? (maquinas / totalMaquinasGlobalCalculado) * 100 : 0
                }))
                .sort((a, b) => b.maquinas - a.maquinas)
                .slice(0, 10);

            top10TableBody.innerHTML = '';
            modelosOrdenados.forEach((item, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${item.modelo}</td>
                    <td class="result-value">${item.maquinas.toFixed(2)}</td>
                    <td class="result-value">${item.porcentaje.toFixed(2)}%</td>
                `;
                top10TableBody.appendChild(row);
            });
            
            // --- Lógica para la gráfica (general, no por modelo) ---
            const ctx = document.getElementById('grafica').getContext('2d');
            const sumaPorMes = {};
            meses.forEach(mes => sumaPorMes[mes] = 0);
            demandaData.forEach(row => {
                meses.forEach(mes => {
                    const valor = parseFloat((row[mes] || '0').toString().replace(/,/g, '').trim());
                    if (!isNaN(valor)) {
                        sumaPorMes[mes] += valor;
                    }
                });
            });

            const calculo100PorMes = [];
            const nuevoCalculoPorMes = [];
            const mesIndexMap = {
                'Enero': 0, 'Febrero': 1, 'Marzo': 2, 'Abril': 3, 'Mayo': 4, 'Junio': 5,
                'Julio': 6, 'Agosto': 7, 'Septiembre': 8, 'Octubre': 9, 'Noviembre': 10, 'Diciembre': 11
            };

            meses.forEach(mes => {
                const demandaDelMes = sumaPorMes[mes];
                let sumaTotal100PorMes = 0;
                let sumaTotalPorMes = 0;
                
                const today = new Date();
                const currentYear = today.getFullYear();
                const monthIndex = mesIndexMap[mes];
                const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();

                if (demandaDelMes > 0 && daysInMonth > 0 && variability > 0) {
                    capacidadData.forEach(filaCapacidad => {
                        const uphReal = parseFloat(filaCapacidad['UPH Real']) || 0;
                        const uph100 = parseFloat(filaCapacidad['UPH 100%']) || 0;
                        const Sabado3= 1862;
                        const horasDisponibles = (variability-Sabado3) *60 ;

                        if (uphReal > 0) {
                            const resultado = (demandaDelMes/uphReal)*60;
                            const horasnecesarias= resultado/horasDisponibles;
                            const Maquinastotales= horasnecesarias/daysInMonth;
                            sumaTotalPorMes += Maquinastotales;
                        }
                        
                        if (uph100 > 0) {
                            const resultado100 = (demandaDelMes/uph100)*60;
                            const horasnecesarias100= resultado100/horasDisponibles;
                            const Maquinastotales100= horasnecesarias100/daysInMonth;
                            sumaTotal100PorMes += Maquinastotales100;
                        }
                    });
                }
                nuevoCalculoPorMes.push(sumaTotalPorMes);
                calculo100PorMes.push(sumaTotal100PorMes);
            });

            const labels = meses;
            const maxMaquinasNecesarias = Math.ceil(Math.max(...nuevoCalculoPorMes));            
            resultadoMaquinas.textContent = maxMaquinasNecesarias;

            if (myChartInstance) {
                myChartInstance.destroy();
            }

            myChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Equipos necesarios Real',
                        data: nuevoCalculoPorMes,
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Equipos Necesarios al 100%',
                        data: calculo100PorMes,
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
                                text: 'Demanda / UPH Requerido'
                            }
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

        } else {
            console.warn("Datos de demanda o capacidad no encontrados.");
            resultadoMaquinas.textContent = 'N/A';
        }
    } catch (error) {
        console.error("Error al cargar gráfico o Top 10:", error);
        resultadoMaquinas.textContent = 'Error';
    }
    
     generarPDFBtn.addEventListener('click', () => {
        const {
            jsPDF
        } = window.jspdf;
        const doc = new jsPDF('p', 'pt', 'letter');
        
        // --- Primera página: Gráfica con título ---
        const chartCanvas = document.getElementById('grafica');
        const chartImgData = chartCanvas.toDataURL('image/png', 1.0);
        const chartImgProps = doc.getImageProperties(chartImgData);
        
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = doc.internal.pageSize.getHeight(); // Obtener la altura total de la página

        // Calcular el ancho de la imagen para que ocupe un 90% del ancho del PDF
        const imgDisplayWidth = pdfWidth * 0.9;
        // Calcular la altura de la imagen manteniendo la proporción
        const imgDisplayHeight = (chartImgProps.height * imgDisplayWidth) / chartImgProps.width;

        // Calcular las coordenadas para centrar la imagen
        const xOffsetChart = (pdfWidth - imgDisplayWidth) / 2;
        // Dejar espacio para el título, por eso se ajusta la Y
        const yOffsetChart = (pdfHeight - imgDisplayHeight) / 2 + 20; // +20 para bajar un poco la gráfica y dar espacio al título

        // Añadir el título "Reporte SCC" centrado
        const titleText = "Reporte SCC";
        doc.setFontSize(24);
        doc.text(titleText, pdfWidth / 2, 80, { align: 'center' }); // 80pt desde arriba para el título

        // Añadir la gráfica centrada
        doc.addImage(chartImgData, 'PNG', xOffsetChart, yOffsetChart, imgDisplayWidth, imgDisplayHeight);

        // --- Segunda página: Contenido HTML ---
        doc.addPage();
        
        const chartContainer = document.getElementById('grafica').closest('.chart-container');
        chartContainer.style.display = 'none'; // Oculta la gráfica para no capturarla de nuevo

        const content = document.querySelector('.container');
        html2canvas(content, { scale: 2 }).then(canvas => {
            const imgDataContent = canvas.toDataURL('image/png');
            const imgPropsContent = doc.getImageProperties(imgDataContent);
            
            // Calcular el ancho de la imagen para que ocupe un 90% del ancho del PDF
            const contentDisplayWidth = pdfWidth * 0.9;
            // Calcular la altura de la imagen manteniendo la proporción
            const contentDisplayHeight = (imgPropsContent.height * contentDisplayWidth) / imgPropsContent.width;

            // Calcular las coordenadas para centrar la imagen
            const xOffsetContent = (pdfWidth - contentDisplayWidth) / 2;
            const yOffsetContent = (pdfHeight - contentDisplayHeight) / 2;

            doc.addImage(imgDataContent, 'PNG', xOffsetContent, yOffsetContent, contentDisplayWidth, contentDisplayHeight);

            chartContainer.style.display = 'block'; // Vuelve a mostrar la gráfica en la página web

            doc.save(`reporte_scc_${new Date().toISOString().slice(0, 10)}.pdf`);
        });
    });

    regresarBtn.addEventListener('click', async () => {
        try {
            await window.clearObjectStore(window.STORE_DEMANDA);
            await window.clearObjectStore(window.STORE_INFORMACION);
            await window.clearObjectStore(window.STORE_FORM_ADICIONAL);
            window.location.href = './index.html';
        } catch (error) {
            console.error('Error al borrar datos:', error);
        }
    });
});