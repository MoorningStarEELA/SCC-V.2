document.addEventListener('DOMContentLoaded', async () => {
    const resultadoModelo = document.getElementById('ResultadoModelo');
    const resultadoProductividad = document.getElementById('ResultadoProductividad');
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
            
            // Placeholder para cálculos futuros
            resultadoProductividad.textContent = '87.2%';
            resultadoOEE.textContent = '82.6%';
        }
    } catch (error) {
        console.error("Error al cargar datos:", error);
    }
    
    // Cargar gráfico de demanda
    try {
        const demandaData = await window.getAllDataFromIndexedDB(window.STORE_DEMANDA);
        if (demandaData && demandaData.length > 0) {
            const ctx = document.getElementById('grafica').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: demandaData.map((_, i) => `Periodo ${i + 1}`),
                    datasets: [{
                        label: 'Demanda',
                        data: demandaData.map(d => d.ValorDemanda || 0),
                        backgroundColor: 'rgba(66, 193, 199, 0.7)',
                        borderColor: 'rgba(66, 193, 199, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: 'Unidades' }
                        },
                        x: {
                            title: { display: true, text: 'Periodo' }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error("Error al cargar gráfico:", error);
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
            alert("Error al borrar datos: " + error.message);
        }
    });
});