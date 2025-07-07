function Validar(){
            var turno1 = document.querySelector('input[name="Turno1Obligatorio"]:checked');
            var turno2 = document.querySelector('input[name="turno2"]:checked');
            var turno3 = document.querySelector('input[name="turno3"]:checked');
            var modelo = document.forms["dtAdicionales"]["Modelos"].value;
            var xdia = document.forms["dtAdicionales"]["Xdia"].value;
            var yi = document.forms["dtAdicionales"]["YI"].value;


            if(turno1 === ""  || turno2 === "" ||turno3 === "" || modelo === "" || xdia === "" || yi === ""){
                document.getElementById("Mensaje").innerHTML = "Por favor, complete todos los campos.";
            }else{
                document.getElementById("Mensaje").innerHTML = "Los campos están completos";
                onclick=Calcular();
            }
            
        }
        
       
        function Calcular() {
                var turno1 = document.querySelector('input[name="Turno1Obligatorio"]:checked').value;
                var turno2 = document.querySelector('input[name="turno2"]:checked').value;
                var turno3 = document.querySelector('input[name="turno3"]:checked').value;
                var modelo = parseFloat(document.forms["dtAdicionales"]["Modelos"].value);
                var xdia = parseFloat(document.forms["dtAdicionales"]["Xdia"].value);
                var yi = parseFloat(document.forms["dtAdicionales"]["YI"].value);

                var turno1Hrs = 0;
                var turno2Hrs = 0;
                var turno3Hrs = 0;
            

                if (turno1 === "1") {
                    turno1Hrs = 7.2;
                }
                if (turno2 === "1") {
                    turno2Hrs = 6.8;
                }
                if (turno3 === "1") {
                    turno3Hrs = 7.8;
                }

                if (turno1 === ("1")|| turno2 === ("1")) {  
                    var SumaPrimeros2Turnos = turno1Hrs + turno2Hrs;
                }
            
            
                if (turno1 === ("1")|| turno3 === ("1")) {  
                    var SumaTurnos13 = turno1Hrs + turno3Hrs;
                }
                if (turno1 === ("1")|| turno2 === ("1") || turno3 === ("1 ")) {  
                    var SumatotalTurnos = turno1Hrs + turno2Hrs + turno3Hrs;
                }
                

                if (!isNaN(modelo)) {
                    var Cambiomodelo = modelo * 0.3;
                }
                if (!isNaN(xdia)) {
                    var Cambioxdia = turno1Hrs - xdia;
                }

                if (!isNaN(yi)) {
                    var Cambioyi = yi * .95;
                }



                // Aquí puedes continuar con los cálculos necesarios usando turno1Hrs, turno2Hrs, turno3Hrs, modelo, xdia y yi
                console.log(turno1Hrs, turno2Hrs, turno3Hrs,SumaPrimeros2Turnos, SumaTurnos13 , SumatotalTurnos, Cambiomodelo, Cambioxdia, Cambioyi);
            }


            var turno1 = document.querySelector('input[name="Turno1Obligatorio"]:checked');
            var turno2 = document.querySelector('input[name="turno2"]:checked');
            var turno3 = document.querySelector('input[name="turno3"]:checked');
            var modelo = document.forms["dtAdicionales"]["Modelos"].value;
            var xdia = document.forms["dtAdicionales"]["Xdia"].value;
            var yi = document.forms["dtAdicionales"]["YI"].value;

            document.getElementById('fileInput').click();
            document.getElementById('fileInput').addEventListener('change', function(event) {
                const file = event.target.files[0];
                if (file) {
                    document.getElementById('MensajeAD').textContent = 'Archivo seleccionado: ' + file.name;
                } else {
                    document.getElementById('MensajeAD').textContent = 'No se seleccionó ningún archivo.';
                }
        });
