
import type { Team } from './types';

export const predefinedTeams: Omit<Team, 'id'>[] = [
  // UEFA Clubs
  // England
  { name: 'Arsenal FC', type: 'club', crestUrl: 'https://crests.football-data.org/57.png', countryOrConfederation: 'UEFA / England', league: 'Premier League' },
  { name: 'Aston Villa FC', type: 'club', crestUrl: 'https://crests.football-data.org/58.png', countryOrConfederation: 'UEFA / England', league: 'Premier League' },
  { name: 'Chelsea FC', type: 'club', crestUrl: 'https://crests.football-data.org/61.png', countryOrConfederation: 'UEFA / England', league: 'Premier League' },
  { name: 'Everton FC', type: 'club', crestUrl: 'https://crests.football-data.org/62.png', countryOrConfederation: 'UEFA / England', league: 'Premier League' },
  { name: 'Fulham FC', type: 'club', crestUrl: 'https://crests.football-data.org/63.png', countryOrConfederation: 'UEFA / England', league: 'Premier League' },
  { name: 'Liverpool FC', type: 'club', crestUrl: 'https://crests.football-data.org/64.png', countryOrConfederation: 'UEFA / England', league: 'Premier League' },
  { name: 'Manchester City FC', type: 'club', crestUrl: 'https://crests.football-data.org/65.png', countryOrConfederation: 'UEFA / England', league: 'Premier League' },
  { name: 'Manchester United FC', type: 'club', crestUrl: 'https://crests.football-data.org/66.png', countryOrConfederation: 'UEFA / England', league: 'Premier League' },
  { name: 'Newcastle United FC', type: 'club', crestUrl: 'https://crests.football-data.org/67.png', countryOrConfederation: 'UEFA / England', league: 'Premier League' },
  { name: 'Tottenham Hotspur FC', type: 'club', crestUrl: 'https://crests.football-data.org/73.png', countryOrConfederation: 'UEFA / England', league: 'Premier League' },
  { name: 'West Ham United FC', type: 'club', crestUrl: 'https://crests.football-data.org/563.png', countryOrConfederation: 'UEFA / England', league: 'Premier League' },
  { name: 'Wolverhampton Wanderers FC', type: 'club', crestUrl: 'https://crests.football-data.org/76.png', countryOrConfederation: 'UEFA / England', league: 'Premier League' },
  
  // Spain
  { name: 'Athletic Club', type: 'club', crestUrl: 'https://crests.football-data.org/77.png', countryOrConfederation: 'UEFA / Spain', league: 'La Liga' },
  { name: 'Atlético de Madrid', type: 'club', crestUrl: 'https://crests.football-data.org/78.png', countryOrConfederation: 'UEFA / Spain', league: 'La Liga' },
  { name: 'FC Barcelona', type: 'club', crestUrl: 'https://crests.football-data.org/81.png', countryOrConfederation: 'UEFA / Spain', league: 'La Liga' },
  { name: 'Real Betis', type: 'club', crestUrl: 'https://crests.football-data.org/90.png', countryOrConfederation: 'UEFA / Spain', league: 'La Liga' },
  { name: 'Real Madrid CF', type: 'club', crestUrl: 'https://crests.football-data.org/86.png', countryOrConfederation: 'UEFA / Spain', league: 'La Liga' },
  { name: 'Real Sociedad', type: 'club', crestUrl: 'https://crests.football-data.org/92.png', countryOrConfederation: 'UEFA / Spain', league: 'La Liga' },
  { name: 'Sevilla FC', type: 'club', crestUrl: 'https://crests.football-data.org/559.png', countryOrConfederation: 'UEFA / Spain', league: 'La Liga' },
  { name: 'Valencia CF', type: 'club', crestUrl: 'https://crests.football-data.org/95.png', countryOrConfederation: 'UEFA / Spain', league: 'La Liga' },
  { name: 'Villarreal CF', type: 'club', crestUrl: 'https://crests.football-data.org/94.png', countryOrConfederation: 'UEFA / Spain', league: 'La Liga' },
  
  // Germany
  { name: 'Bayer 04 Leverkusen', type: 'club', crestUrl: 'https://crests.football-data.org/3.png', countryOrConfederation: 'UEFA / Germany', league: 'Bundesliga' },
  { name: 'FC Bayern München', type: 'club', crestUrl: 'https://crests.football-data.org/5.png', countryOrConfederation: 'UEFA / Germany', league: 'Bundesliga' },
  { name: 'Borussia Dortmund', type: 'club', crestUrl: 'https://crests.football-data.org/4.png', countryOrConfederation: 'UEFA / Germany', league: 'Bundesliga' },
  { name: 'Borussia Mönchengladbach', type: 'club', crestUrl: 'https://crests.football-data.org/18.png', countryOrConfederation: 'UEFA / Germany', league: 'Bundesliga' },
  { name: 'Eintracht Frankfurt', type: 'club', crestUrl: 'https://crests.football-data.org/19.png', countryOrConfederation: 'UEFA / Germany', league: 'Bundesliga' },
  { name: 'RB Leipzig', type: 'club', crestUrl: 'https://crests.football-data.org/721.png', countryOrConfederation: 'UEFA / Germany', league: 'Bundesliga' },
  { name: 'VfB Stuttgart', type: 'club', crestUrl: 'https://crests.football-data.org/10.png', countryOrConfederation: 'UEFA / Germany', league: 'Bundesliga' },
  { name: 'VfL Wolfsburg', type: 'club', crestUrl: 'https://crests.football-data.org/11.png', countryOrConfederation: 'UEFA / Germany', league: 'Bundesliga' },

  // Italy
  { name: 'AC Milan', type: 'club', crestUrl: 'https://crests.football-data.org/98.png', countryOrConfederation: 'UEFA / Italy', league: 'Serie A' },
  { name: 'AS Roma', type: 'club', crestUrl: 'https://crests.football-data.org/100.png', countryOrConfederation: 'UEFA / Italy', league: 'Serie A' },
  { name: 'Atalanta BC', type: 'club', crestUrl: 'https://crests.football-data.org/102.png', countryOrConfederation: 'UEFA / Italy', league: 'Serie A' },
  { name: 'FC Internazionale Milano', type: 'club', crestUrl: 'https://crests.football-data.org/108.png', countryOrConfederation: 'UEFA / Italy', league: 'Serie A' },
  { name: 'Juventus FC', type: 'club', crestUrl: 'https://crests.football-data.org/109.png', countryOrConfederation: 'UEFA / Italy', league: 'Serie A' },
  { name: 'Lazio', type: 'club', crestUrl: 'https://crests.football-data.org/110.png', countryOrConfederation: 'UEFA / Italy', league: 'Serie A' },
  { name: 'SSC Napoli', type: 'club', crestUrl: 'https://crests.football-data.org/113.png', countryOrConfederation: 'UEFA / Italy', league: 'Serie A' },
  { name: 'Fiorentina', type: 'club', crestUrl: 'https://crests.football-data.org/99.png', countryOrConfederation: 'UEFA / Italy', league: 'Serie A' },
  
  // France
  { name: 'AS Monaco FC', type: 'club', crestUrl: 'https://crests.football-data.org/546.png', countryOrConfederation: 'UEFA / France', league: 'Ligue 1' },
  { name: 'Lille OSC', type: 'club', crestUrl: 'https://crests.football-data.org/521.png', countryOrConfederation: 'UEFA / France', league: 'Ligue 1' },
  { name: 'Olympique Lyonnais', type: 'club', crestUrl: 'https://crests.football-data.org/523.png', countryOrConfederation: 'UEFA / France', league: 'Ligue 1' },
  { name: 'Olympique de Marseille', type: 'club', crestUrl: 'https://crests.football-data.org/516.png', countryOrConfederation: 'UEFA / France', league: 'Ligue 1' },
  { name: 'Paris Saint-Germain FC', type: 'club', crestUrl: 'https://crests.football-data.org/524.png', countryOrConfederation: 'UEFA / France', league: 'Ligue 1' },
  { name: 'Stade Rennais FC', type: 'club', crestUrl: 'https://crests.football-data.org/529.png', countryOrConfederation: 'UEFA / France', league: 'Ligue 1' },

  // Portugal
  { name: 'FC Porto', type: 'club', crestUrl: 'https://crests.football-data.org/503.png', countryOrConfederation: 'UEFA / Portugal', league: 'Primeira Liga' },
  { name: 'SL Benfica', type: 'club', crestUrl: 'https://crests.football-data.org/507.png', countryOrConfederation: 'UEFA / Portugal', league: 'Primeira Liga' },
  { name: 'Sporting CP', type: 'club', crestUrl: 'https://crests.football-data.org/502.png', countryOrConfederation: 'UEFA / Portugal', league: 'Primeira Liga' },
  { name: 'SC Braga', type: 'club', crestUrl: 'https://crests.football-data.org/583.png', countryOrConfederation: 'UEFA / Portugal', league: 'Primeira Liga' },

  // Netherlands
  { name: 'AFC Ajax', type: 'club', crestUrl: 'https://crests.football-data.org/678.png', countryOrConfederation: 'UEFA / Netherlands', league: 'Eredivisie' },
  { name: 'Feyenoord Rotterdam', type: 'club', crestUrl: 'https://crests.football-data.org/675.png', countryOrConfederation: 'UEFA / Netherlands', league: 'Eredivisie' },
  { name: 'PSV', type: 'club', crestUrl: 'https://crests.football-data.org/674.png', countryOrConfederation: 'UEFA / Netherlands', league: 'Eredivisie' },

  // CONMEBOL Clubs
  // Brazil
  { name: 'Athletico Paranaense', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/athletico-paranaense.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série A' },
  { name: 'Atlético Goianiense', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/atletico-goianiense.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série A' },
  { name: 'Atlético Mineiro', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/atletico-mineiro.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série A' },
  { name: 'Bahia', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/bahia.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série A' },
  { name: 'Botafogo', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/botafogo.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série A' },
  { name: 'Corinthians', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/corinthians.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série A' },
  { name: 'Criciúma', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/criciuma.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série A' },
  { name: 'Cruzeiro', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/cruzeiro.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série A' },
  { name: 'Cuiabá', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/cuiaba-esporte-clube.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série A' },
  { name: 'Flamengo', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/flamengo.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série A' },
  { name: 'Fluminense', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/fluminense.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série A' },
  { name: 'Fortaleza', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/fortaleza.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série A' },
  { name: 'Grêmio', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/gremio.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série A' },
  { name: 'Internacional', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/internacional.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série A' },
  { name: 'Juventude', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/juventude.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série A' },
  { name: 'Palmeiras', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/palmeiras.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série A' },
  { name: 'Red Bull Bragantino', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/red-bull-bragantino.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série A' },
  { name: 'São Paulo', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/sao-paulo-futebol-clube.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série A' },
  { name: 'Vasco da Gama', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/vasco-da-gama.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série A' },
  { name: 'Vitória', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/vitoria.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série A' },
  { name: 'Santos', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/santos.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série B' },

  // Argentina
  { name: 'Boca Juniors', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Boca_Juniors_2012_logo.svg', countryOrConfederation: 'CONMEBOL / Argentina', league: 'Liga Profesional' },
  { name: 'River Plate', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Escudo_de_River_Plate.svg/1200px-Escudo_de_River_Plate.svg.png', countryOrConfederation: 'CONMEBOL / Argentina', league: 'Liga Profesional' },
  { name: 'Independiente', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Escudo_del_Club_Atl%C3%A9tico_Independiente.svg/1200px-Escudo_del_Club_Atl%C3%A9tico_Independiente.svg.png', countryOrConfederation: 'CONMEBOL / Argentina', league: 'Liga Profesional' },
  { name: 'Racing Club', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Escudo_de_Racing_Club_%282014%29.svg/1200px-Escudo_de_Racing_Club_%282014%29.svg.png', countryOrConfederation: 'CONMEBOL / Argentina', league: 'Liga Profesional' },
  { name: 'San Lorenzo', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Escudo_del_Club_Atl%C3%A9tico_San_Lorenzo_de_Almagro.svg/1200px-Escudo_del_Club_Atl%C3%A9tico_San_Lorenzo_de_Almagro.svg.png', countryOrConfederation: 'CONMEBOL / Argentina', league: 'Liga Profesional' },
  { name: 'Estudiantes', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Escudo_de_Estudiantes_de_La_Plata.svg/1200px-Escudo_de_Estudiantes_de_La_Plata.svg.png', countryOrConfederation: 'CONMEBOL / Argentina', league: 'Liga Profesional' },
  
  // Uruguay
  { name: 'Peñarol', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a2/C.A._Pe%C3%B1arol_logo.svg/1200px-C.A._Pe%C3%B1arol_logo.svg.png', countryOrConfederation: 'CONMEBOL / Uruguay', league: 'Primera División' },
  { name: 'Nacional', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Club_Nacional_de_Football_2021_logo.svg/1200px-Club_Nacional_de_Football_2021_logo.svg.png', countryOrConfederation: 'CONMEBOL / Uruguay', league: 'Primera División' },

  // Paraguay
  { name: 'Olimpia', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Logo_Club_Olimpia.svg/1200px-Logo_Club_Olimpia.svg.png', countryOrConfederation: 'CONMEBOL / Paraguay', league: 'Primera División' },
  { name: 'Cerro Porteño', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Escudo_del_Club_Cerro_Porte%C3%B1o.svg/1200px-Escudo_del_Club_Cerro_Porte%C3%B1o.svg.png', countryOrConfederation: 'CONMEBOL / Paraguay', league: 'Primera División' },
  { name: 'Libertad', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Logo_del_Club_Libertad.svg/1200px-Logo_del_Club_Libertad.svg.png', countryOrConfederation: 'CONMEBOL / Paraguay', league: 'Primera División' },
  { name: 'Guaraní', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Escudo_del_Club_Guaran%C3%AD.svg/1200px-Escudo_del_Club_Guaran%C3%AD.svg.png', countryOrConfederation: 'CONMEBOL / Paraguay', league: 'Primera División' },
  { name: 'Sportivo Luqueño', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Escudo_del_Club_Sportivo_Luque%C3%B1o.svg/1200px-Escudo_del_Club_Sportivo_Luque%C3%B1o.svg.png', countryOrConfederation: 'CONMEBOL / Paraguay', league: 'Primera División' },
  { name: 'Sol de América', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Escudo_de_Sol_de_Am%C3%A9rica_de_Asunci%C3%B3n.svg/1200px-Escudo_de_Sol_de_Am%C3%A9rica_de_Asunci%C3%B3n.svg.png', countryOrConfederation: 'CONMEBOL / Paraguay', league: 'Primera División' },
  
  // Colombia
  { name: 'Atlético Nacional', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Escudo_de_Atl%C3%A9tico_Nacional.svg/1200px-Escudo_de_Atl%C3%A9tico_Nacional.svg.png', countryOrConfederation: 'CONMEBOL / Colombia', league: 'Categoría Primera A' },
  { name: 'Millonarios', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Escudo_de_Millonarios_F%C3%BAtbol_Club.svg/1200px-Escudo_de_Millonarios_F%C3%BAtbol_Club.svg.png', countryOrConfederation: 'CONMEBOL / Colombia', league: 'Categoría Primera A' },
  
  // Chile
  { name: 'Colo-Colo', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Escudo_de_Colo-Colo.svg/1200px-Escudo_de_Colo-Colo.svg.png', countryOrConfederation: 'CONMEBOL / Chile', league: 'Primera División' },
  { name: 'Universidad de Chile', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Escudo_de_la_Universidad_de_Chile.svg/1200px-Escudo_de_la_Universidad_de_Chile.svg.png', countryOrConfederation: 'CONMEBOL / Chile', league: 'Primera División' },
  
  // Ecuador
  { name: 'LDU Quito', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e7/LDU_Quito_logo.svg/1200px-LDU_Quito_logo.svg.png', countryOrConfederation: 'CONMEBOL / Ecuador', league: 'Serie A' },
  { name: 'Independiente del Valle', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c3/Independiente_del_Valle_logo.svg/1200px-Independiente_del_Valle_logo.svg.png', countryOrConfederation: 'CONMEBOL / Ecuador', league: 'Serie A' },


  // National Teams
  // UEFA
  { name: 'Germany', type: 'national', crestUrl: 'https://crests.football-data.org/759.svg', countryOrConfederation: 'UEFA' },
  { name: 'England', type: 'national', crestUrl: 'https://crests.football-data.org/770.svg', countryOrConfederation: 'UEFA' },
  { name: 'Spain', type: 'national', crestUrl: 'https://crests.football-data.org/760.svg', countryOrConfederation: 'UEFA' },
  { name: 'France', type: 'national', crestUrl: 'https://crests.football-data.org/773.svg', countryOrConfederation: 'UEFA' },
  { name: 'Italy', type: 'national', crestUrl: 'https://crests.football-data.org/784.svg', countryOrConfederation: 'UEFA' },
  { name: 'Portugal', type: 'national', crestUrl: 'https://crests.football-data.org/765.svg', countryOrConfederation: 'UEFA' },
  { name: 'Netherlands', type: 'national', crestUrl: 'https://crests.football-data.org/766.svg', countryOrConfederation: 'UEFA' },
  { name: 'Belgium', type: 'national', crestUrl: 'https://crests.football-data.org/805.svg', countryOrConfederation: 'UEFA' },
  { name: 'Croatia', type: 'national', crestUrl: 'https://crests.football-data.org/799.svg', countryOrConfederation: 'UEFA' },
  { name: 'Switzerland', type: 'national', crestUrl: 'https://crests.football-data.org/788.svg', countryOrConfederation: 'UEFA' },
  { name: 'Austria', type: 'national', crestUrl: 'https://crests.football-data.org/812.svg', countryOrConfederation: 'UEFA' },
  { name: 'Denmark', type: 'national', crestUrl: 'https://crests.football-data.org/782.svg', countryOrConfederation: 'UEFA' },
  { name: 'Sweden', type: 'national', crestUrl: 'https://crests.football-data.org/792.svg', countryOrConfederation: 'UEFA' },
  { name: 'Norway', type: 'national', crestUrl: 'https://crests.football-data.org/814.svg', countryOrConfederation: 'UEFA' },
  { name: 'Poland', type: 'national', crestUrl: 'https://crests.football-data.org/808.svg', countryOrConfederation: 'UEFA' },
  { name: 'Czech Republic', type: 'national', crestUrl: 'https://crests.football-data.org/798.svg', countryOrConfederation: 'UEFA' },
  { name: 'Slovakia', type: 'national', crestUrl: 'https://crests.football-data.org/793.svg', countryOrConfederation: 'UEFA' },
  { name: 'Slovenia', type: 'national', crestUrl: 'https://crests.football-data.org/795.svg', countryOrConfederation: 'UEFA' },
  { name: 'Hungary', type: 'national', crestUrl: 'https://crests.football-data.org/811.svg', countryOrConfederation: 'UEFA' },
  { name: 'Romania', type: 'national', crestUrl: 'https://crests.football-data.org/809.svg', countryOrConfederation: 'UEFA' },
  { name: 'Bulgaria', type: 'national', crestUrl: 'https://crests.football-data.org/806.svg', countryOrConfederation: 'UEFA' },
  { name: 'Serbia', type: 'national', crestUrl: 'https://crests.football-data.org/825.svg', countryOrConfederation: 'UEFA' },
  { name: 'Bosnia and Herzegovina', type: 'national', crestUrl: 'https://crests.football-data.org/821.svg', countryOrConfederation: 'UEFA' },
  { name: 'North Macedonia', type: 'national', crestUrl: 'https://crests.football-data.org/837.svg', countryOrConfederation: 'UEFA' },
  { name: 'Albania', type: 'national', crestUrl: 'https://crests.football-data.org/823.svg', countryOrConfederation: 'UEFA' },
  { name: 'Scotland', type: 'national', crestUrl: 'https://crests.football-data.org/771.svg', countryOrConfederation: 'UEFA' },
  { name: 'Republic of Ireland', type: 'national', crestUrl: 'https://crests.football-data.org/803.svg', countryOrConfederation: 'UEFA' },
  { name: 'Northern Ireland', type: 'national', crestUrl: 'https://crests.football-data.org/772.svg', countryOrConfederation: 'UEFA' },
  { name: 'Wales', type: 'national', crestUrl: 'https://crests.football-data.org/774.svg', countryOrConfederation: 'UEFA' },
  { name: 'Finland', type: 'national', crestUrl: 'https://crests.football-data.org/802.svg', countryOrConfederation: 'UEFA' },
  { name: 'Iceland', type: 'national', crestUrl: 'https://crests.football-data.org/815.svg', countryOrConfederation: 'UEFA' },
  { name: 'Turkey', type: 'national', crestUrl: 'https://crests.football-data.org/790.svg', countryOrConfederation: 'UEFA' },
  { name: 'Greece', type: 'national', crestUrl: 'https://crests.football-data.org/801.svg', countryOrConfederation: 'UEFA' },
  { name: 'Georgia', type: 'national', crestUrl: 'https://crests.football-data.org/829.svg', countryOrConfederation: 'UEFA' },
  { name: 'Russia', type: 'national', crestUrl: 'https://crests.football-data.org/808.svg', countryOrConfederation: 'UEFA' },
  { name: 'Ukraine', type: 'national', crestUrl: 'https://crests.football-data.org/810.svg', countryOrConfederation: 'UEFA' },

  // CONMEBOL
  { name: 'Brazil', type: 'national', crestUrl: 'https://crests.football-data.org/764.svg', countryOrConfederation: 'CONMEBOL' },
  { name: 'Argentina', type: 'national', crestUrl: 'https://crests.football-data.org/762.svg', countryOrConfederation: 'CONMEBOL' },
  { name: 'Uruguay', type: 'national', crestUrl: 'https://crests.football-data.org/758.svg', countryOrConfederation: 'CONMEBOL' },
  { name: 'Chile', type: 'national', crestUrl: 'https://crests.football-data.org/779.svg', countryOrConfederation: 'CONMEBOL' },
  { name: 'Paraguay', type: 'national', crestUrl: 'https://crests.football-data.org/780.svg', countryOrConfederation: 'CONMEBOL' },
  { name: 'Colombia', type: 'national', crestUrl: 'https://crests.football-data.org/767.svg', countryOrConfederation: 'CONMEBOL' },
  { name: 'Ecuador', type: 'national', crestUrl: 'https://crests.football-data.org/775.svg', countryOrConfederation: 'CONMEBOL' },
  { name: 'Peru', type: 'national', crestUrl: 'https://crests.football-data.org/776.svg', countryOrConfederation: 'CONMEBOL' },
  { name: 'Bolivia', type: 'national', crestUrl: 'https://crests.football-data.org/778.svg', countryOrConfederation: 'CONMEBOL' },
  { name: 'Venezuela', type: 'national', crestUrl: 'https://crests.football-data.org/804.svg', countryOrConfederation: 'CONMEBOL' },
  
  // CONCACAF
  { name: 'Costa Rica', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8d/Costa_Rica_national_football_team_crest.svg/1200px-Costa_Rica_national_football_team_crest.svg.png', countryOrConfederation: 'CONCACAF' },
  { name: 'Honduras', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/41/Honduras_national_football_team_crest.svg/1200px-Honduras_national_football_team_crest.svg.png', countryOrConfederation: 'CONCACAF' },
  { name: 'Panama', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a7/Panamanian_Football_Federation_logo.svg/1200px-Panamanian_Football_Federation_logo.svg.png', countryOrConfederation: 'CONCACAF' },
  { name: 'Mexico', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f9/Mexico_national_football_team_seal.svg/1200px-Mexico_national_football_team_seal.svg.png', countryOrConfederation: 'CONCACAF' },
  { name: 'United States', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Crest_of_the_United_States_Soccer_Federation.svg/1200px-Crest_of_the_United_States_Soccer_Federation.svg.png', countryOrConfederation: 'CONCACAF' },
  { name: 'Canada', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c5/Canada_Soccer_Association_logo.svg/1200px-Canada_Soccer_Association_logo.svg.png', countryOrConfederation: 'CONCACAF' },

  // CAF
  { name: 'Nigeria', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f3/Nigeria_national_football_team_logo.svg/1200px-Nigeria_national_football_team_logo.svg.png', countryOrConfederation: 'CAF' },
  { name: 'Cameroon', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/Cameroon_national_football_team_logo.svg/1200px-Cameroon_national_football_team_logo.svg.png', countryOrConfederation: 'CAF' },
  { name: 'Ivory Coast', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e6/C%C3%B4te_d%27Ivoire_national_football_team_crest.svg/1200px-C%C3%B4te_d%27Ivoire_national_football_team_crest.svg.png', countryOrConfederation: 'CAF' },
  { name: 'Ghana', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/Ghana_national_football_team_seal.svg/1200px-Ghana_national_football_team_seal.svg.png', countryOrConfederation: 'CAF' },
  { name: 'Senegal', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/69/Senegal_national_football_team_crest.svg/1200px-Senegal_national_football_team_crest.svg.png', countryOrConfederation: 'CAF' },
  { name: 'Mali', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a5/Mali_national_football_team_crest.svg/1200px-Mali_national_football_team_crest.svg.png', countryOrConfederation: 'CAF' },
  { name: 'Togo', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/fa/Togo_national_football_team_crest.svg/1200px-Togo_national_football_team_crest.svg.png', countryOrConfederation: 'CAF' },
  { name: 'Tunisia', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/ce/Tunisia_national_football_team_crest.svg/1200px-Tunisia_national_football_team_crest.svg.png', countryOrConfederation: 'CAF' },
  { name: 'Algeria', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/41/Algeria_national_football_team_crest.svg/1200px-Algeria_national_football_team_crest.svg.png', countryOrConfederation: 'CAF' },
  { name: 'Egypt', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a2/Egypt_national_football_team_logo.svg/1200px-Egypt_national_football_team_logo.svg.png', countryOrConfederation: 'CAF' },
  { name: 'Morocco', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4c/Morocco_national_football_team_logo.svg/1200px-Morocco_national_football_team_logo.svg.png', countryOrConfederation: 'CAF' },
  { name: 'South Africa', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/28/South_Africa_national_football_team_logo_2019.svg/1200px-South_Africa_national_football_team_logo_2019.svg.png', countryOrConfederation: 'CAF' },
  
  // AFC
  { name: 'Japan', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/70/Japan_national_football_team_crest.svg/1200px-Japan_national_football_team_crest.svg.png', countryOrConfederation: 'AFC' },
  { name: 'South Korea', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/13/South_Korea_national_football_team_logo.svg/1200px-South_Korea_national_football_team_logo.svg.png', countryOrConfederation: 'AFC' },
  { name: 'North Korea', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6c/North_Korea_national_football_team_logo.svg/1200px-North_Korea_national_football_team_logo.svg.png', countryOrConfederation: 'AFC' },
  { name: 'Saudi Arabia', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0d/Saudi_Arabia_national_football_team_logo.svg/1200px-Saudi_Arabia_national_football_team_logo.svg.png', countryOrConfederation: 'AFC' },
  { name: 'Iran', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/ca/Iran_national_football_team_logo.svg/1200px-Iran_national_football_team_logo.svg.png', countryOrConfederation: 'AFC' },
  { name: 'Iraq', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c9/Iraq_national_football_team_logo.svg/1200px-Iraq_national_football_team_logo.svg.png', countryOrConfederation: 'AFC' },
  { name: 'Qatar', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e0/Qatar_national_football_team_logo.svg/1200px-Qatar_national_football_team_logo.svg.png', countryOrConfederation: 'AFC' },
  { name: 'Australia', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/77/Football_Australia_logo.svg/1200px-Football_Australia_logo.svg.png', countryOrConfederation: 'AFC' },
  
  // OFC
  { name: 'New Zealand', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c5/New_Zealand_national_football_team_logo.svg/1200px-New_Zealand_national_football_team_logo.svg.png', countryOrConfederation: 'OFC' },
];
