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
            const currentYear = new Date().getFullYear();
            const mesIndexMap = {
                'Enero': 0, 'Febrero': 1, 'Marzo': 2, 'Abril': 3, 'Mayo': 4, 'Junio': 5,
                'Julio': 6, 'Agosto': 7, 'Septiembre': 8, 'Octubre': 9, 'Noviembre': 10, 'Diciembre': 11
            };

            // --- Top 10 calculado para el mes actual ---
            const fechaActual = new Date();
            const mesActualIndex = fechaActual.getMonth();
            const mesActualNombre = Object.keys(mesIndexMap).find(
                key => mesIndexMap[key] === mesActualIndex
            );
            const daysInMonth = new Date(currentYear, mesActualIndex + 1, 0).getDate();

            // Calcular demanda del mes actual
            let demandaDelMes = 0;
            demandaData.forEach(row => {
                const valor = parseFloat((row[mesActualNombre] || '0').toString().replace(/,/g, '').trim());
                if (!isNaN(valor)) demandaDelMes += valor;
            });

            const Sabado3 = 1862;
            const horasDisponibles = (variability - Sabado3) * 60;

            const modelosMaquinas = {};
            let totalMaquinasGlobal = 0;

            capacidadData.forEach(fila => {
                const modelo = fila['Ensamble (Número)'];
                const uphReal = parseFloat(fila['UPH Real']) || 0;

                if (uphReal > 0 && demandaDelMes > 0) {
                    const resultado = (demandaDelMes / uphReal) * 60;
                    const horasnecesarias = resultado / horasDisponibles;
                    const Maquinastotales = horasnecesarias / daysInMonth;

                    modelosMaquinas[modelo] = Maquinastotales;
                    totalMaquinasGlobal += Maquinastotales;
                }
            });

            const modelosOrdenados = Object.entries(modelosMaquinas)
                .map(([modelo, maquinas]) => ({
                    modelo,
                    maquinas,
                    porcentaje: (totalMaquinasGlobal > 0) ? (maquinas / totalMaquinasGlobal) * 100 : 0
                }))
                .sort((a, b) => b.maquinas - a.maquinas)
                .slice(0, 10);

            // --- Llenar la tabla Top 10 ---
            top10TableBody.innerHTML = '';
            modelosOrdenados.forEach((item, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${item.modelo}</td>
                    <td class="result-value">${item.porcentaje.toFixed(2)}%</td>
                `;
                top10TableBody.appendChild(row);
            });

            // --- Lógica de la gráfica ---
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

            meses.forEach(mes => {
                const demandaDelMes = sumaPorMes[mes];
                let sumaTotal100PorMes = 0;
                let sumaTotalPorMes = 0;
                
                const monthIndex = mesIndexMap[mes];
                const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();

                if (demandaDelMes > 0 && daysInMonth > 0 && variability > 0) {
                    capacidadData.forEach(filaCapacidad => {
                        const uphReal = parseFloat(filaCapacidad['UPH Real']) || 0;
                        const uph100 = parseFloat(filaCapacidad['UPH 100%']) || 0;
                        const Sabado3 = 1862;
                        const horasDisponibles = (variability - Sabado3) * 60;

                        if (uphReal > 0) {
                            const resultado = (demandaDelMes / uphReal) * 60;
                            const horasnecesarias = resultado / horasDisponibles;
                            const Maquinastotales = horasnecesarias / daysInMonth;
                            sumaTotalPorMes += Maquinastotales;
                        }
                        
                        if (uph100 > 0) {
                            const resultado100 = (demandaDelMes / uph100) * 60;
                            const horasnecesarias100 = resultado100 / horasDisponibles;
                            const Maquinastotales100 = horasnecesarias100 / daysInMonth;
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

            if (myChartInstance) myChartInstance.destroy();

            myChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
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
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: true },
                        x: { title: { display: true, text: 'Mes' } }
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
    
    // --- Botón de PDF ---
    generarPDFBtn.addEventListener('click', async () => {
        generarPDFBtn.style.display = 'none';
        regresarBtn.style.display = 'none';

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'pt', 'letter');
        const content = document.querySelector('.container');

        try {
            const canvas = await html2canvas(content, { scale: 2, logging: true, useCORS: true });
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const imgProps = doc.getImageProperties(imgData);

            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = doc.internal.pageSize.getHeight();
            const margin = 20;
            const imgDisplayWidth = pdfWidth - 2 * margin;
            const imgDisplayHeight = (imgProps.height * imgDisplayWidth) / imgProps.width;

            let heightLeft = imgDisplayHeight;
            let position = margin;

            doc.setFontSize(24);
            doc.text("Reporte SCC", pdfWidth / 2, 40, { align: 'center' });
            position = 60;

            doc.addImage(imgData, 'JPEG', margin, position, imgDisplayWidth, imgDisplayHeight);
            heightLeft -= (pdfHeight - position);

            while (heightLeft >= 0) {
                position = heightLeft - imgDisplayHeight + margin;
                doc.addPage();
                doc.addImage(imgData, 'JPEG', margin, position, imgDisplayWidth, imgDisplayHeight);
                heightLeft -= pdfHeight;
            }

            doc.save(`reporte_scc_${new Date().toISOString().slice(0, 10)}.pdf`);
        } catch (error) {
            console.error("Error al generar el PDF:", error);
        } finally {
            generarPDFBtn.style.display = 'inline-block';
            regresarBtn.style.display = 'inline-block';
        }
    });

    // --- Botón regresar ---
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
