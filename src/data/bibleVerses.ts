// =========================================================================
// BANCO DE VERSÍCULOS BÍBLICOS INSPIRACIONALES
// Colección de pasajes de fortaleza, fe, esperanza y bendición para la iglesia
// =========================================================================

export const BIBLE_VERSES: string[] = [
  '«Porque donde están dos o tres congregados en mi nombre, allí estoy yo en medio de ellos.» — Mateo 18:20',
  '«Todo lo puedo en Cristo que me fortalece.» — Filipenses 4:13',
  '«Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis.» — Jeremías 29:11',
  '«Jehová es mi pastor; nada me faltará. En lugares de delicados pastos me hará descansar; junto a aguas de reposo me pastoreará.» — Salmos 23:1-2',
  '«Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia. Reconócelo en todos tus caminos, y él enderezará tus veredas.» — Proverbios 3:5-6',
  '«Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque Jehová tu Dios estará contigo en dondequiera que vayas.» — Josué 1:9',
  '«Pero los que esperan a Jehová tendrán nuevas fuerzas; levantarán alas como las águilas; correrán, y no se cansarán; caminarán, y no se fatigarán.» — Isaías 40:31',
  '«Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien, esto es, a los que conforme a su propósito son llamados.» — Romanos 8:28',
  '«Dios es nuestro amparo y fortaleza, nuestro pronto auxilio en las tribulaciones.» — Salmos 46:1',
  '«Lámpara es a mis pies tu palabra, y lumbrera a mi camino.» — Salmos 119:105',
  '«No se turbe vuestro corazón; creéis en Dios, creed también en mí.» — Juan 14:1',
  '«Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar.» — Mateo 11:28',
  '«Por nada estéis afanosos, sino sean conocidas vuestras peticiones delante de Dios en toda oración y ruego, con acción de gracias.» — Filipenses 4:6',
  '«El Señor te bendiga, y te guarde; el Señor haga resplandecer su rostro sobre ti, y tenga de ti misericordia; el Señor alce sobre ti su rostro, y ponga en ti paz.» — Números 6:24-26',
  '«Clama a mí, y yo te responderé, y te enseñaré cosas grandes y ocultas que tú no conoces.» — Jeremías 33:3',
  '«El que habita al abrigo del Altísimo morará bajo la sombra del Omnipotente.» — Salmos 91:1',
  '«Si Dios es por nosotros, ¿quién contra nosotros?» — Romanos 8:31',
  '«Y la paz de Dios, que sobrepasa todo entendimiento, guardará vuestros corazones y vuestros pensamientos en Cristo Jesús.» — Filipenses 4:7',
  '«Instruye al niño en su camino, y aun cuando fuere viejo no se apartará de él.» — Proverbios 22:6',
  '«Mas buscad primeramente el reino de Dios y su justicia, y todas estas cosas os serán añadidas.» — Mateo 6:33',
  '«Porque con gozo saldréis, y en paz seréis vueltos; los montes y los collados levantarán canción delante de vosotros.» — Isaías 55:12',
  '«Gustad, y ved que es bueno Jehová; dichoso el hombre que confía en él.» — Salmos 34:8',
  '«Yo soy el camino, y la verdad, y la vida; nadie viene al Padre, sino por mí.» — Juan 14:6',
  '«Grande es su fidelidad; sus misericordias son nuevas cada mañana.» — Lamentaciones 3:23',
  '«El amor es sufrido, es benigno; el amor no tiene envidia, no es jactancioso, no se envanece.» — 1 Corintios 13:4',
  '«De modo que si alguno está en Cristo, nueva criatura es; las cosas viejas pasaron; he aquí todas son hechas nuevas.» — 2 Corintios 5:17',
  '«Porque no nos ha dado Dios espíritu de cobardía, sino de poder, de amor y de dominio propio.» — 2 Timoteo 1:7',
  '«Bienaventurados los de limpio corazón, porque ellos verán a Dios.» — Mateo 5:8',
  '«Alzaré mis ojos a los montes; ¿de dónde vendrá mi socorro? Mi socorro viene de Jehová, que hizo los cielos y la tierra.» — Salmos 121:1-2',
  '«En paz me acostaré, y asimismo dormiré; porque solo tú, Jehová, me haces vivir confiado.» — Salmos 4:8',
  '«Ciertamente el bien y la misericordia me seguirán todos los días de mi vida, y en la casa de Jehová moraré por largos días.» — Salmos 23:6',
  '«El da esfuerzo al cansado, y multiplica las fuerzas al que no tiene ningunas.» — Isaías 40:29',
  '«Sed, pues, imitadores de Dios como hijos amados, y andad en amor, como también Cristo nos amó.» — Efesios 5:1-2',
  '«El corazón alegre constituye buen remedio; mas el espíritu triste seca los huesos.» — Proverbios 17:22',
  '«Porque por fe andamos, no por vista.» — 2 Corintios 5:7',
  '«He aquí, yo estoy a la puerta y llamo; si alguno oye mi voz y abre la puerta, entraré a él, y cenaré con él, y él conmigo.» — Apocalipsis 3:20',
  '«La gracia de nuestro Señor Jesucristo sea con todos vosotros. Amén.» — Romanos 16:24',
  '«No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo; siempre te ayudaré, siempre te sustentaré con la diestra de mi justicia.» — Isaías 41:10',
  '«Pondré en ti un corazón nuevo y un espíritu nuevo dentro de vosotros.» — Ezequiel 36:26',
  '«El gozo de Jehová es vuestra fuerza.» — Nehemías 8:10'
];

/**
 * Retorna un versículo bíblico aleatorio de la colección.
 */
export function getRandomBibleVerse(): string {
  const index = Math.floor(Math.random() * BIBLE_VERSES.length);
  return BIBLE_VERSES[index];
}

/**
 * Retorna un versículo bíblico aleatorio distinto al actual.
 */
export function getRandomBibleVerseExcluding(current?: string): string {
  if (!current || BIBLE_VERSES.length <= 1) {
    return getRandomBibleVerse();
  }
  const filtered = BIBLE_VERSES.filter((v) => v !== current);
  const index = Math.floor(Math.random() * filtered.length);
  return filtered[index];
}
