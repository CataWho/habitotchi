import { useEffect, useRef, useState } from "react";
import { alCambiar, type Clave } from "@/lib/almacenamiento";

/* ==========================================================
   LEER UN DATO GUARDADO Y ENTERARSE SI CAMBIA
   ==========================================================
   Igual que hacer useState(() => cargarLoQueSea()), pero
   además se vuelve a leer cuando otra parte de la app guarda
   esa misma clave.

   Es para los datos que se tocan en una pantalla y se miran
   en otra. El caso de origen: el interruptor del ciclo
   menstrual está en Ajustes y decide si aparece un panel en
   Salud.

   Para el estado que solo vive dentro de su propia pantalla
   (lo que estás escribiendo en un campo, qué juego elegiste)
   no hace falta: alcanza con useState.
   ========================================================== */

export function useGuardado<T>(clave: Clave, cargar: () => T): T {
  const [valor, setValor] = useState(cargar);

  /* La función de carga se vuelve a crear en cada render. Si
     estuviera en las dependencias del efecto, nos
     suscribiríamos y desuscribiríamos sin parar; guardada en
     una ref, la suscripción se arma una sola vez y igual usa
     siempre la versión más nueva. */
  const ultimaCarga = useRef(cargar);
  ultimaCarga.current = cargar;

  useEffect(() => alCambiar(clave, () => setValor(ultimaCarga.current())), [clave]);

  return valor;
}
