# Propuesta: sistema de recompensas por estrellas

> Documento de diseño para validar la idea antes de implementarla.

## 1. Punto de partida

La aplicación ya concede entre **1 y 3 estrellas por lección**, conserva el
mejor resultado de cada lección y muestra el total acumulado. El avance por el
mapa, en cambio, depende de dominar la lección anterior: se necesitan dos
intentos con al menos un 80 % de aciertos.

Conviene mantener separadas estas dos ideas:

- **Progreso pedagógico:** decide qué lección se abre. No debería poder
  comprarse ni saltarse con estrellas.
- **Recompensas:** celebran la constancia y permiten desbloquear elementos
  visuales, pero no bloquean el aprendizaje.

Así se evita que un niño que necesita más práctica sienta que recibe un
castigo o que no puede continuar.

## 2. Experiencia recomendada

Añadir una sección llamada **Mis recompensas**, accesible al tocar el contador
de estrellas y también desde `Mis desafíos`. Allí se mostraría un camino corto
de premios con tres estados claros:

1. **Conseguida:** a todo color, con la fecha en que se obtuvo.
2. **Siguiente premio:** destacado y con el texto «Te faltan X estrellas».
3. **Bloqueada:** visible en silueta, con su meta de estrellas.

Cuando el total cruce una meta, al terminar la ronda se presentaría una sola
celebración breve: «¡Nueva recompensa!». Debe poder cerrarse inmediatamente y
no debería interrumpir una actividad.

### Primer catálogo sugerido

| Estrellas | Recompensa | Tipo |
| ---: | --- | --- |
| 5 | Insignia «Primeros pasos» | Insignia |
| 10 | Marco de avatar «Hojas verdes» | Cosmética |
| 20 | Pegatina «Leo lector» | Coleccionable |
| 35 | Fondo «Biblioteca mágica» | Cosmética |
| 50 | Insignia «Cazador de palabras» | Insignia |
| 75 | Marco de avatar «Arcoíris» | Cosmética |
| 100 | Trofeo «Gran explorador» | Trofeo |

Las metas iniciales son deliberadamente cercanas. Después de probarlas con
usuarios reales se pueden ajustar sin cambiar las estrellas ya obtenidas.

## 3. Reglas propuestas

### Cómo se ganan

Se conserva la regla actual por lección:

- **1 estrella:** completar la ronda con algún acierto al primer intento.
- **2 estrellas:** lograr al menos un 80 %.
- **3 estrellas:** lograr el 100 %.
- Repetir una lección solo aumenta el total cuando mejora su mejor marca; las
  estrellas no se acumulan sin límite repitiendo el mismo contenido.

### Cómo se desbloquean los premios

- Los premios se desbloquean automáticamente al alcanzar su meta.
- Las estrellas **no se gastan**: funcionan como puntos de experiencia. Esta
  mecánica es más fácil de comprender que una tienda y evita arrepentimientos.
- Un premio conseguido nunca vuelve a bloquearse.
- No habrá recompensas por rachas diarias en la primera versión; una ausencia
  no debe provocar pérdida ni presión.

### Qué no se recomienda

- Premios aleatorios, cofres sorpresa o mecánicas de azar.
- Penalizaciones, pérdida de estrellas o mensajes de culpa.
- Ventajas que permitan omitir contenido pedagógico.
- Sonidos o animaciones largos sin opción de reducirlos.
- Una tienda en el MVP: añade decisiones y complejidad sin validar primero si
  el camino de recompensas resulta motivador.

## 4. Pantallas y textos

### Contador de estrellas

Convertir el contador actual en botón con una etiqueta accesible como
«42 estrellas. Ver recompensas». Puede incluir una barra discreta hacia el
próximo premio, por ejemplo: **42 / 50**.

### Galería de recompensas

Cada tarjeta debería incluir:

- imagen o icono;
- nombre corto;
- meta requerida;
- estado, comunicado con texto además del color;
- botón **Usar** solo para marcos o fondos configurables.

### Celebración al completar una ronda

Orden sugerido de información:

1. resultado de aprendizaje;
2. estrellas obtenidas o mejoradas en esa ronda;
3. recompensa nueva, si existe;
4. acciones «Ver mis recompensas» y «Seguir mi camino».

Ejemplos de mensajes:

- «¡Mejoraste tu marca! Ganaste 1 estrella nueva.»
- «¡Desbloqueaste el marco Arcoíris!»
- «Te faltan 3 estrellas para tu próximo premio.»

## 5. Modelo de datos sugerido

El catálogo puede vivir inicialmente en código para funcionar sin conexión:

```ts
type Reward = {
  id: string;
  name: string;
  description: string;
  threshold: number;
  kind: "badge" | "frame" | "background" | "trophy";
  art: string;
};

type RewardProgress = {
  unlockedAt: Record<string, string>;
  equipped: {
    frame?: string;
    background?: string;
  };
};
```

El desbloqueo se puede derivar del total de estrellas, pero guardar
`unlockedAt` permite mostrar la fecha y detectar cuáles son nuevas. Se
recomienda una clave versionada, por ejemplo `leocontigo.rewards.v1`, sin
modificar los intentos existentes en `leocontigo.progress.v1`.

Al abrir la aplicación después de actualizarla, se compararía el total actual
con todo el catálogo. De ese modo, una familia con progreso previo recibe de
inmediato los premios que ya le corresponden.

## 6. Alcance recomendado para el MVP

1. Catálogo fijo de siete recompensas.
2. Galería con estados conseguida, siguiente y bloqueada.
3. Desbloqueo automático por total de estrellas.
4. Aviso de recompensa nueva al finalizar una ronda.
5. Persistencia local y migración del progreso existente.
6. Sin tienda, rachas, monedas adicionales ni sincronización en la nube.

## 7. Accesibilidad, privacidad y familias

- No depender únicamente del color para expresar estados.
- Respetar `prefers-reduced-motion` en confeti y celebraciones.
- Mantener objetivos y textos breves, adecuados para lectura infantil.
- Permitir que la familia silencie celebraciones sin perder premios.
- Mantener todos los datos en el navegador, como el progreso actual.
- Evitar rankings públicos o comparaciones entre niños.

## 8. Criterios de aceptación para una futura implementación

- El total visible coincide con la suma de la mejor marca de cada lección.
- Mejorar de 1 a 2 estrellas suma solo una estrella al total; repetir el mismo
  resultado no suma ninguna.
- Al cruzar varias metas de una vez se desbloquean todos los premios, pero la
  interfaz no encadena ventanas molestas.
- El progreso anterior a la función desbloquea los premios correspondientes.
- Borrar el progreso desde las opciones también borra recompensas y elementos
  equipados, después de una confirmación adulta.
- La aplicación sigue funcionando completamente sin conexión.
- Todas las acciones se pueden completar con teclado y lector de pantalla.

## 9. Decisiones a validar antes de programar

1. **Tipo de premio:** ¿solo una colección para mirar o también marcos y fondos
   que el niño pueda equipar?
2. **Identidad visual:** ¿usar únicamente a Leo y Mía o sumar nuevos personajes
   y escenarios?
3. **Ritmo:** ¿las metas 5, 10, 20, 35, 50, 75 y 100 se sienten alcanzables con
   la duración real de las sesiones?
4. **Entrada a la galería:** ¿contador de estrellas, pestaña propia o ambas?
5. **Reinicio:** ¿debe existir un PIN o una pregunta para adultos antes de
   borrar el progreso y los premios?

La recomendación es validar primero un prototipo visual de la galería y la
celebración. Con esas cinco decisiones resueltas, el MVP puede implementarse
sin alterar las reglas pedagógicas actuales.
