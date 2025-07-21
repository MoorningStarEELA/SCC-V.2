// resultados.js
document.addEventListener('DOMContentLoaded', async () => {
    const resultadoModelo = document.getElementById('ResultadoModelo');
    const resultadoProductividad = document.getElementById('ResultadoProductividad'); // This will now be Efficiency
    const resultadoNPI = document.getElementById('ResultadoNPI');
    const resultadoYield = document.getElementById('ResultadoYield');
    const resultadoOEE = document.getElementById('ResultadoOEE');
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
            
            // OEE placeholder. You'll need to define how OEE is calculated.
            // OEE (Overall Equipment Effectiveness) is typically calculated as:
            // OEE = Availability x Performance x Quality
            // Availability: (Operating Time / Planned Production Time)
            // Performance: (Actual Production Rate / Ideal Production Rate)
            // Quality: (Good Count / Total Count)
            // You have 'Yield' which relates to Quality.
            // 'Eficiencia' (Performance) is now calculated.
            // You'd need more data (e.g., total planned production time, actual operating time, good/total count)
            // to calculate OEE accurately. For now, keep the placeholder or remove it if not used.
            resultadoOEE.textContent = 'N/A (Cálculo Pendiente)'; 
        }
    } catch (error) {
        console.error("Error al cargar datos del formulario:", error);
    }

    // Cargar datos de capacidad para la eficiencia
    try {
        const capacidadData = await window.getAllDataFromIndexedDB(window.STORE_CAPACIDAD);
        if (capacidadData && capacidadData.length > 0) {
            // Calculate average efficiency
            const totalEfficiency = capacidadData.reduce((sum, row) => sum + (row['Eficiencia'] || 0), 0);
            const averageEfficiency = totalEfficiency / capacidadData.length;
            resultadoProductividad.textContent = `${averageEfficiency.toFixed(2)}%`; // Display average efficiency
        } else {
            resultadoProductividad.textContent = 'N/A';
        }
    } catch (error) {
        console.error("Error al cargar datos de capacidad para eficiencia:", error);
        resultadoProductividad.textContent = 'Error';
    }
    
    // Cargar gráfico de demanda (existing code)
    try {
        const demandaData = await window.getAllDataFromIndexedDB(window.STORE_DEMANDA);
        if (demandaData && demandaData.length > 0) {
            const ctx = document.getElementById('grafica').getContext('2d');
            
            const labels = demandaData.map(row => row.Mes); // Assuming 'Mes' is the month column
            const dataValues = demandaData.map(row => row.Demanda); // Assuming 'Demanda' is the demand column
            
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Demanda por Mes',
                        data: dataValues,
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgba(54, 162, 235, 1)',
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
                                text: 'Demanda'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Periodo'
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error("Error al cargar gráfico:", error);
    }
    
    // Generar PDF (existing code)
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
    
    // Regresar al inicio y borrar datos (existing code)
    regresarBtn.addEventListener('click', async () => {
        try {
            await window.clearObjectStore(window.STORE_DEMANDA);
            await window.clearObjectStore(window.STORE_CAPACIDAD);
            await window.clearObjectStore(window.STORE_FORM_ADICIONAL);
            window.location.href = './index.html';
        } catch (error) {
            console.error('Error al borrar datos:', error);
        }
    });
});