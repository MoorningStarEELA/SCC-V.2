document.addEventListener('DOMContentLoaded', async () => {
    const resultadoModelo = document.getElementById('ResultadoModelo');
    const resultadoProductividad = document.getElementById('ResultadoProductividad'); // Se mostrará como porcentaje
    const resultadoNPI = document.getElementById('ResultadoNPI');
    const resultadoYield = document.getElementById('ResultadoYield');
    const resultadoOEE = document.getElementById('ResultadoOEE');
    const generarPDFBtn = document.getElementById('generarPDF');
    const regresarBtn = document.getElementById('regresarBtn');
    
    // Cargar datos del formulario adicional
    try {
        const formResponses = await window.getAllDataFromIndexedDB(window.STORE_FORM_ADICIONAL);
        if (formResponses && formResponses.length > 0) {
            const latestResponse = formResponses[0];

            resultadoModelo.textContent = latestResponse.Cambiomodelo.toFixed(2);
            resultadoNPI.textContent = latestResponse.Cambioxdia.toFixed(2);
            resultadoYield.textContent = latestResponse.Cambioyi.toFixed(2);
            resultadoProductividad.textContent = (latestResponse.Eficiencia).toFixed(2);
            resultadoOEE.textContent = (latestResponse.OEE* 100).toFixed(2) + '%'; // Mostrar OEE como porcentaje
            
            // OEE corregido para mostrarse como porcentaje
            const capacidadData = await window.getAllDataFromIndexedDB(window.STORE_CAPACIDAD);
            let promedioEficiencia = 0;

            if(capacidadData && capacidadData.length > 0) {
                const totalEfficiency = capacidadData.reduce((sum , row) => sum +(row['Eficiencia'] || 0), 0);
                promedioEficiencia= totalEfficiency/ capacidadData.length;

                resultadoProductividad.textContent = `${(promedioEficiencia * 100).toFixed(2)}%`;
                
            }

            const variability = latestResponse.Variability || 0;
            const yieldFactor = latestResponse.Cambioyi || 0;
            const OEE = variability * promedioEficiencia * yieldFactor;

            resultadoOEE.textContent = `${(OEE * 100).toFixed(2)}%`;
        }
    } catch (error) {
        console.error("Error al cargar datos del formulario:", error);
    }

    // Cargar datos de eficiencia desde hoja de capacidad
    try {
        const capacidadData = await window.getAllDataFromIndexedDB(window.STORE_CAPACIDAD);
        if (capacidadData && capacidadData.length > 0) {
            const totalEfficiency = capacidadData.reduce((sum, row) => sum + (row['Eficiencia'] || 0), 0);
            const averageEfficiency = totalEfficiency / capacidadData.length;

            // Mostrar eficiencia como porcentaje
            resultadoProductividad.textContent = `${(averageEfficiency * 100).toFixed(2)}%`;
        } else {
            resultadoProductividad.textContent = 'N/A';
        }
    } catch (error) {
        console.error("Error al cargar datos de capacidad para eficiencia:", error);
        resultadoProductividad.textContent = 'Error';
    }

    // Cargar gráfico de demanda
    
   try {
    const demandaData = await window.getAllDataFromIndexedDB(window.STORE_DEMANDA);
    if (demandaData && demandaData.length > 0) {
        const ctx = document.getElementById('grafica').getContext('2d');

        const meses = [
            'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto',
            'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
            'Enero', 'Febrero'
        ];

        const sumaPorMes = {};
        meses.forEach(mes => sumaPorMes[mes] = 0); // Inicializar en cero

        demandaData.forEach(row => {
            meses.forEach(mes => {
                const valor = parseFloat((row[mes] || '0').toString().replace(/,/g, '').trim());
                if (!isNaN(valor)) {
                    sumaPorMes[mes] += valor;
                }
            });
        });

        const labels = meses;
        const dataValues = labels.map(mes => sumaPorMes[mes]);

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Demanda Total por Mes',
                    data: dataValues,
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
                            text: 'Demanda Total'
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
    }
} catch (error) {
    console.error("Error al cargar gráfico:", error);
}


    // Generar PDF del reporte
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

    // Borrar datos y regresar al inicio
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
