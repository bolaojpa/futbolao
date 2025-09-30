
import type { Team } from './types';

export const predefinedTeams: Omit<Team, 'id'>[] = [
  // ===============================================================================================
  // CONMEBOL Clubs
  // ===============================================================================================
  // Brazil - Série A
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
  
  // Brazil - Série B
  { name: 'Amazonas', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/amazonas-fc.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série B' },
  { name: 'América-MG', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/america-mineiro.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série B' },
  { name: 'Avaí', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/avai.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série B' },
  { name: 'Botafogo-SP', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/botafogo-sp.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série B' },
  { name: 'Brusque', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/brusque.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série B' },
  { name: 'Ceará', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/ceara.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série B' },
  { name: 'Chapecoense', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/chapecoense.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série B' },
  { name: 'Coritiba', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/coritiba.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série B' },
  { name: 'CRB', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/crb-clube-de-regatas-brasil.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série B' },
  { name: 'Goiás', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/goias.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série B' },
  { name: 'Guarani', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/guarani.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série B' },
  { name: 'Ituano', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/ituano.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série B' },
  { name: 'Mirassol', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/mirassol.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série B' },
  { name: 'Novorizontino', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/gremio-novorizontino.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série B' },
  { name: 'Operário-PR', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/operario-ferroviario.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série B' },
  { name: 'Paysandu', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/paysandu.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série B' },
  { name: 'Ponte Preta', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/ponte-preta.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série B' },
  { name: 'Santos', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/santos.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série B' },
  { name: 'Sport Recife', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/sport-recife.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série B' },
  { name: 'Vila Nova', type: 'club', crestUrl: 'https://logodetimes.com/wp-content/uploads/vila-nova.png', countryOrConfederation: 'CONMEBOL / Brasil', league: 'Brasileirão Série B' },
  
  // Argentina
  { name: 'Boca Juniors', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Boca_Juniors_2012_logo.svg', countryOrConfederation: 'CONMEBOL / Argentina', league: 'Liga Profesional' },
  { name: 'River Plate', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Escudo_de_River_Plate.svg', countryOrConfederation: 'CONMEBOL / Argentina', league: 'Liga Profesional' },
  { name: 'Independiente', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Escudo_del_Club_Atl%C3%A9tico_Independiente.svg', countryOrConfederation: 'CONMEBOL / Argentina', league: 'Liga Profesional' },
  { name: 'Racing Club', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/56/Escudo_de_Racing_Club_%282014%29.svg', countryOrConfederation: 'CONMEBOL / Argentina', league: 'Liga Profesional' },
  { name: 'San Lorenzo', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Escudo_del_Club_Atl%C3%A9tico_San_Lorenzo_de_Almagro.svg', countryOrConfederation: 'CONMEBOL / Argentina', league: 'Liga Profesional' },
  { name: 'Estudiantes', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/18/Escudo_de_Estudiantes_de_La_Plata.svg', countryOrConfederation: 'CONMEBOL / Argentina', league: 'Liga Profesional' },
  { name: 'Vélez Sarsfield', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/2/2 Vélez_Sarsfield_logo.svg', countryOrConfederation: 'CONMEBOL / Argentina', league: 'Liga Profesional' },
  { name: 'Huracán', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Escudo_del_Club_Atl%C3%A9tico_Hurac%C3%A1n.svg', countryOrConfederation: 'CONMEBOL / Argentina', league: 'Liga Profesional' },
  { name: 'Newell\'s Old Boys', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/1/1d/Newell%27s_Old_Boys_logo.svg', countryOrConfederation: 'CONMEBOL / Argentina', league: 'Liga Profesional' },
  { name: 'Rosario Central', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/5/51/Rosario_Central_logo.svg', countryOrConfederation: 'CONMEBOL / Argentina', league: 'Liga Profesional' },
  
  // Uruguay
  { name: 'Peñarol', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a2/C.A._Pe%C3%B1arol_logo.svg', countryOrConfederation: 'CONMEBOL / Uruguay', league: 'Primera División' },
  { name: 'Nacional', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/09/Club_Nacional_de_Football_2021_logo.svg', countryOrConfederation: 'CONMEBOL / Uruguay', league: 'Primera División' },
  { name: 'Defensor Sporting', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/0/05/Defensor_Sporting_Club_logo.svg', countryOrConfederation: 'CONMEBOL / Uruguay', league: 'Primera División' },
  { name: 'Danubio', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/c/c5/Danubio_F.C._logo.svg', countryOrConfederation: 'CONMEBOL / Uruguay', league: 'Primera División' },
  
  // Paraguay
  { name: 'Olimpia', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Logo_Club_Olimpia.svg', countryOrConfederation: 'CONMEBOL / Paraguay', league: 'Primera División' },
  { name: 'Cerro Porteño', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Escudo_del_Club_Cerro_Porte%C3%B1o.svg', countryOrConfederation: 'CONMEBOL / Paraguay', league: 'Primera División' },
  { name: 'Libertad', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Logo_del_Club_Libertad.svg', countryOrConfederation: 'CONMEBOL / Paraguay', league: 'Primera División' },
  { name: 'Guaraní', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Escudo_del_Club_Guaran%C3%AD.svg', countryOrConfederation: 'CONMEBOL / Paraguay', league: 'Primera División' },
  
  // Colombia
  { name: 'Atlético Nacional', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Escudo_de_Atl%C3%A9tico_Nacional.svg', countryOrConfederation: 'CONMEBOL / Colombia', league: 'Categoría Primera A' },
  { name: 'Millonarios', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Escudo_de_Millonarios_F%C3%BAtbol_Club.svg', countryOrConfederation: 'CONMEBOL / Colombia', league: 'Categoría Primera A' },
  { name: 'América de Cali', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/d/d8/America_de_Cali_logo.svg', countryOrConfederation: 'CONMEBOL / Colombia', league: 'Categoría Primera A' },
  { name: 'Independiente Santa Fe', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/e/e9/Independiente_Santa_Fe_logo.svg', countryOrConfederation: 'CONMEBOL / Colombia', league: 'Categoría Primera A' },
  
  // Chile
  { name: 'Colo-Colo', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/80/Escudo_de_Colo-Colo.svg', countryOrConfederation: 'CONMEBOL / Chile', league: 'Primera División' },
  { name: 'Universidad de Chile', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Escudo_de_la_Universidad_de_Chile.svg', countryOrConfederation: 'CONMEBOL / Chile', league: 'Primera División' },
  { name: 'Universidad Católica', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7b/Universidad_Cat%C3%B3lica_logo.svg', countryOrConfederation: 'CONMEBOL / Chile', league: 'Primera División' },
  
  // Ecuador
  { name: 'LDU Quito', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/e/e7/LDU_Quito_logo.svg', countryOrConfederation: 'CONMEBOL / Ecuador', league: 'Serie A' },
  { name: 'Independiente del Valle', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/c/c3/Independiente_del_Valle_logo.svg', countryOrConfederation: 'CONMEBOL / Ecuador', league: 'Serie A' },
  { name: 'Barcelona SC', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/e/e8/Barcelona_Sporting_Club_logo.svg', countryOrConfederation: 'CONMEBOL / Ecuador', league: 'Serie A' },

  // ===============================================================================================
  // UEFA Clubs
  // ===============================================================================================
  // England
  { name: 'Arsenal', type: 'club', crestUrl: 'https://crests.football-data.org/57.png', countryOrConfederation: 'UEFA / England', league: 'Premier League' },
  { name: 'Aston Villa', type: 'club', crestUrl: 'https://crests.football-data.org/58.png', countryOrConfederation: 'UEFA / England', league: 'Premier League' },
  { name: 'Chelsea', type: 'club', crestUrl: 'https://crests.football-data.org/61.png', countryOrConfederation: 'UEFA / England', league: 'Premier League' },
  { name: 'Everton', type: 'club', crestUrl: 'https://crests.football-data.org/62.png', countryOrConfederation: 'UEFA / England', league: 'Premier League' },
  { name: 'Fulham', type: 'club', crestUrl: 'https://crests.football-data.org/63.png', countryOrConfederation: 'UEFA / England', league: 'Premier League' },
  { name: 'Liverpool', type: 'club', crestUrl: 'https://crests.football-data.org/64.png', countryOrConfederation: 'UEFA / England', league: 'Premier League' },
  { name: 'Manchester City', type: 'club', crestUrl: 'https://crests.football-data.org/65.png', countryOrConfederation: 'UEFA / England', league: 'Premier League' },
  { name: 'Manchester United', type: 'club', crestUrl: 'https://crests.football-data.org/66.png', countryOrConfederation: 'UEFA / England', league: 'Premier League' },
  { name: 'Newcastle United', type: 'club', crestUrl: 'https://crests.football-data.org/67.png', countryOrConfederation: 'UEFA / England', league: 'Premier League' },
  { name: 'Tottenham Hotspur', type: 'club', crestUrl: 'https://crests.football-data.org/73.png', countryOrConfederation: 'UEFA / England', league: 'Premier League' },
  { name: 'West Ham United', type: 'club', crestUrl: 'https://crests.football-data.org/563.png', countryOrConfederation: 'UEFA / England', league: 'Premier League' },
  { name: 'Wolverhampton Wanderers', type: 'club', crestUrl: 'https://crests.football-data.org/76.png', countryOrConfederation: 'UEFA / England', league: 'Premier League' },
  { name: 'AFC Bournemouth', type: 'club', crestUrl: 'https://crests.football-data.org/1044.png', countryOrConfederation: 'UEFA / England', league: 'Premier League' },
  { name: 'Brentford', type: 'club', crestUrl: 'https://crests.football-data.org/402.png', countryOrConfederation: 'UEFA / England', league: 'Premier League' },
  { name: 'Brighton & Hove Albion', type: 'club', crestUrl: 'https://crests.football-data.org/397.png', countryOrConfederation: 'UEFA / England', league: 'Premier League' },
  { name: 'Crystal Palace', type: 'club', crestUrl: 'https://crests.football-data.org/354.png', countryOrConfederation: 'UEFA / England', league: 'Premier League' },
  { name: 'Ipswich Town', type: 'club', crestUrl: 'https://crests.football-data.org/349.png', countryOrConfederation: 'UEFA / England', league: 'Premier League' },
  { name: 'Leicester City', type: 'club', crestUrl: 'https://crests.football-data.org/338.png', countryOrConfederation: 'UEFA / England', league: 'Premier League' },
  { name: 'Nottingham Forest', type: 'club', crestUrl: 'https://crests.football-data.org/394.png', countryOrConfederation: 'UEFA / England', league: 'Premier League' },
  { name: 'Southampton', type: 'club', crestUrl: 'https://crests.football-data.org/340.png', countryOrConfederation: 'UEFA / England', league: 'Premier League' },

  // Spain
  { name: 'Athletic Bilbao', type: 'club', crestUrl: 'https://crests.football-data.org/77.png', countryOrConfederation: 'UEFA / Spain', league: 'La Liga' },
  { name: 'Atlético Madrid', type: 'club', crestUrl: 'https://crests.football-data.org/78.png', countryOrConfederation: 'UEFA / Spain', league: 'La Liga' },
  { name: 'Barcelona', type: 'club', crestUrl: 'https://crests.football-data.org/81.png', countryOrConfederation: 'UEFA / Spain', league: 'La Liga' },
  { name: 'Real Betis', type: 'club', crestUrl: 'https://crests.football-data.org/90.png', countryOrConfederation: 'UEFA / Spain', league: 'La Liga' },
  { name: 'Real Madrid', type: 'club', crestUrl: 'https://crests.football-data.org/86.png', countryOrConfederation: 'UEFA / Spain', league: 'La Liga' },
  { name: 'Real Sociedad', type: 'club', crestUrl: 'https://crests.football-data.org/92.png', countryOrConfederation: 'UEFA / Spain', league: 'La Liga' },
  { name: 'Sevilla', type: 'club', crestUrl: 'https://crests.football-data.org/559.png', countryOrConfederation: 'UEFA / Spain', league: 'La Liga' },
  { name: 'Valencia', type: 'club', crestUrl: 'https://crests.football-data.org/95.png', countryOrConfederation: 'UEFA / Spain', league: 'La Liga' },
  { name: 'Villarreal', type: 'club', crestUrl: 'https://crests.football-data.org/94.png', countryOrConfederation: 'UEFA / Spain', league: 'La Liga' },
  { name: 'Girona', type: 'club', crestUrl: 'https://crests.football-data.org/298.png', countryOrConfederation: 'UEFA / Spain', league: 'La Liga' },
  { name: 'Celta de Vigo', type: 'club', crestUrl: 'https://crests.football-data.org/558.png', countryOrConfederation: 'UEFA / Spain', league: 'La Liga' },
  
  // Germany
  { name: 'Bayer Leverkusen', type: 'club', crestUrl: 'https://crests.football-data.org/3.png', countryOrConfederation: 'UEFA / Germany', league: 'Bundesliga' },
  { name: 'Bayern München', type: 'club', crestUrl: 'https://crests.football-data.org/5.png', countryOrConfederation: 'UEFA / Germany', league: 'Bundesliga' },
  { name: 'Borussia Dortmund', type: 'club', crestUrl: 'https://crests.football-data.org/4.png', countryOrConfederation: 'UEFA / Germany', league: 'Bundesliga' },
  { name: 'Borussia Mönchengladbach', type: 'club', crestUrl: 'https://crests.football-data.org/18.png', countryOrConfederation: 'UEFA / Germany', league: 'Bundesliga' },
  { name: 'Eintracht Frankfurt', type: 'club', crestUrl: 'https://crests.football-data.org/19.png', countryOrConfederation: 'UEFA / Germany', league: 'Bundesliga' },
  { name: 'RB Leipzig', type: 'club', crestUrl: 'https://crests.football-data.org/721.png', countryOrConfederation: 'UEFA / Germany', league: 'Bundesliga' },
  { name: 'VfB Stuttgart', type: 'club', crestUrl: 'https://crests.football-data.org/10.png', countryOrConfederation: 'UEFA / Germany', league: 'Bundesliga' },
  { name: 'VfL Wolfsburg', type: 'club', crestUrl: 'https://crests.football-data.org/11.png', countryOrConfederation: 'UEFA / Germany', league: 'Bundesliga' },
  { name: 'SC Freiburg', type: 'club', crestUrl: 'https://crests.football-data.org/17.png', countryOrConfederation: 'UEFA / Germany', league: 'Bundesliga' },
  { name: 'TSG 1899 Hoffenheim', type: 'club', crestUrl: 'https://crests.football-data.org/2.png', countryOrConfederation: 'UEFA / Germany', league: 'Bundesliga' },

  // Italy
  { name: 'AC Milan', type: 'club', crestUrl: 'https://crests.football-data.org/98.png', countryOrConfederation: 'UEFA / Italy', league: 'Serie A' },
  { name: 'AS Roma', type: 'club', crestUrl: 'https://crests.football-data.org/100.png', countryOrConfederation: 'UEFA / Italy', league: 'Serie A' },
  { name: 'Atalanta', type: 'club', crestUrl: 'https://crests.football-data.org/102.png', countryOrConfederation: 'UEFA / Italy', league: 'Serie A' },
  { name: 'Inter Milan', type: 'club', crestUrl: 'https://crests.football-data.org/108.png', countryOrConfederation: 'UEFA / Italy', league: 'Serie A' },
  { name: 'Juventus', type: 'club', crestUrl: 'https://crests.football-data.org/109.png', countryOrConfederation: 'UEFA / Italy', league: 'Serie A' },
  { name: 'Lazio', type: 'club', crestUrl: 'https://crests.football-data.org/110.png', countryOrConfederation: 'UEFA / Italy', league: 'Serie A' },
  { name: 'Napoli', type: 'club', crestUrl: 'https://crests.football-data.org/113.png', countryOrConfederation: 'UEFA / Italy', league: 'Serie A' },
  { name: 'Fiorentina', type: 'club', crestUrl: 'https://crests.football-data.org/99.png', countryOrConfederation: 'UEFA / Italy', league: 'Serie A' },
  { name: 'Bologna', type: 'club', crestUrl: 'https://crests.football-data.org/103.png', countryOrConfederation: 'UEFA / Italy', league: 'Serie A' },
  { name: 'Torino', type: 'club', crestUrl: 'https://crests.football-data.org/115.png', countryOrConfederation: 'UEFA / Italy', league: 'Serie A' },

  // France
  { name: 'AS Monaco', type: 'club', crestUrl: 'https://crests.football-data.org/546.png', countryOrConfederation: 'UEFA / France', league: 'Ligue 1' },
  { name: 'Lille OSC', type: 'club', crestUrl: 'https://crests.football-data.org/521.png', countryOrConfederation: 'UEFA / France', league: 'Ligue 1' },
  { name: 'Olympique Lyonnais', type: 'club', crestUrl: 'https://crests.football-data.org/523.png', countryOrConfederation: 'UEFA / France', league: 'Ligue 1' },
  { name: 'Olympique Marseille', type: 'club', crestUrl: 'https://crests.football-data.org/516.png', countryOrConfederation: 'UEFA / France', league: 'Ligue 1' },
  { name: 'Paris Saint-Germain', type: 'club', crestUrl: 'https://crests.football-data.org/524.png', countryOrConfederation: 'UEFA / France', league: 'Ligue 1' },
  { name: 'Stade Rennais', type: 'club', crestUrl: 'https://crests.football-data.org/529.png', countryOrConfederation: 'UEFA / France', league: 'Ligue 1' },
  { name: 'OGC Nice', type: 'club', crestUrl: 'https://crests.football-data.org/522.png', countryOrConfederation: 'UEFA / France', league: 'Ligue 1' },
  { name: 'RC Lens', type: 'club', crestUrl: 'https://crests.football-data.org/545.png', countryOrConfederation: 'UEFA / France', league: 'Ligue 1' },

  // Portugal
  { name: 'FC Porto', type: 'club', crestUrl: 'https://crests.football-data.org/503.png', countryOrConfederation: 'UEFA / Portugal', league: 'Primeira Liga' },
  { name: 'SL Benfica', type: 'club', crestUrl: 'https://crests.football-data.org/507.png', countryOrConfederation: 'UEFA / Portugal', league: 'Primeira Liga' },
  { name: 'Sporting CP', type: 'club', crestUrl: 'https://crests.football-data.org/502.png', countryOrConfederation: 'UEFA / Portugal', league: 'Primeira Liga' },
  { name: 'SC Braga', type: 'club', crestUrl: 'https://crests.football-data.org/583.png', countryOrConfederation: 'UEFA / Portugal', league: 'Primeira Liga' },
  
  // Netherlands
  { name: 'Ajax', type: 'club', crestUrl: 'https://crests.football-data.org/678.png', countryOrConfederation: 'UEFA / Netherlands', league: 'Eredivisie' },
  { name: 'Feyenoord', type: 'club', crestUrl: 'https://crests.football-data.org/675.png', countryOrConfederation: 'UEFA / Netherlands', league: 'Eredivisie' },
  { name: 'PSV Eindhoven', type: 'club', crestUrl: 'https://crests.football-data.org/674.png', countryOrConfederation: 'UEFA / Netherlands', league: 'Eredivisie' },

  // Other UEFA
  { name: 'Celtic', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/35/Celtic_FC.svg/1200px-Celtic_FC.svg.png', countryOrConfederation: 'UEFA / Scotland', league: 'Scottish Premiership' },
  { name: 'Rangers', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/43/Rangers_FC.svg/1200px-Rangers_FC.svg.png', countryOrConfederation: 'UEFA / Scotland', league: 'Scottish Premiership' },
  { name: 'Galatasaray', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Galatasaray_S.K._logo.svg/1200px-Galatasaray_S.K._logo.svg.png', countryOrConfederation: 'UEFA / Turkey', league: 'Süper Lig' },
  { name: 'Fenerbahçe', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f3/Fenerbah%C3%A7e_SK.svg/1200px-Fenerbah%C3%A7e_SK.svg.png', countryOrConfederation: 'UEFA / Turkey', league: 'Süper Lig' },
  { name: 'Beşiktaş', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Besiktas_JK_logo.svg/1200px-Besiktas_JK_logo.svg.png', countryOrConfederation: 'UEFA / Turkey', league: 'Süper Lig' },
  { name: 'Club Brugge', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d0/Club_Brugge_KV_logo.svg/1200px-Club_Brugge_KV_logo.svg.png', countryOrConfederation: 'UEFA / Belgium', league: 'Jupiler Pro League' },
  { name: 'Anderlecht', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/62/R.S.C._Anderlecht_logo.svg/1200px-R.S.C._Anderlecht_logo.svg.png', countryOrConfederation: 'UEFA / Belgium', league: 'Jupiler Pro League' },
  
  // ===============================================================================================
  // CONCACAF Clubs
  // ===============================================================================================
  // Mexico
  { name: 'Club América', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/30/Club_Am%C3%A9rica_logo.svg/1200px-Club_Am%C3%A9rica_logo.svg.png', countryOrConfederation: 'CONCACAF / Mexico', league: 'Liga MX' },
  { name: 'CD Guadalajara (Chivas)', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/14/Club_Deportivo_Guadalajara_logo.svg/1200px-Club_Deportivo_Guadalajara_logo.svg.png', countryOrConfederation: 'CONCACAF / Mexico', league: 'Liga MX' },
  { name: 'Cruz Azul', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7d/Cruz_Azul_logo.svg/1200px-Cruz_Azul_logo.svg.png', countryOrConfederation: 'CONCACAF / Mexico', league: 'Liga MX' },
  { name: 'Pumas UNAM', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d4/Club_Universidad_Nacional_logo.svg/1200px-Club_Universidad_Nacional_logo.svg.png', countryOrConfederation: 'CONCACAF / Mexico', league: 'Liga MX' },
  { name: 'CF Monterrey', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a2/CF_Monterrey_logo.svg/1200px-CF_Monterrey_logo.svg.png', countryOrConfederation: 'CONCACAF / Mexico', league: 'Liga MX' },
  { name: 'Tigres UANL', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4f/Tigres_UANL_logo.svg/1200px-Tigres_UANL_logo.svg.png', countryOrConfederation: 'CONCACAF / Mexico', league: 'Liga MX' },
  // USA
  { name: 'LA Galaxy', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/05/LA_Galaxy_logo.svg/1200px-LA_Galaxy_logo.svg.png', countryOrConfederation: 'CONCACAF / USA', league: 'MLS' },
  { name: 'Inter Miami CF', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4c/Inter_Miami_CF_logo.svg/1200px-Inter_Miami_CF_logo.svg.png', countryOrConfederation: 'CONCACAF / USA', league: 'MLS' },
  { name: 'Los Angeles FC', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1a/Los_Angeles_FC_logo.svg/1200px-Los_Angeles_FC_logo.svg.png', countryOrConfederation: 'CONCACAF / USA', league: 'MLS' },
  { name: 'Seattle Sounders FC', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/25/Seattle_Sounders_FC_logo.svg/1200px-Seattle_Sounders_FC_logo.svg.png', countryOrConfederation: 'CONCACAF / USA', league: 'MLS' },
  
  // ===============================================================================================
  // AFC & CAF Clubs
  // ===============================================================================================
  // AFC
  { name: 'Al-Hilal', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c5/Al-Hilal_FC_logo.svg/1200px-Al-Hilal_FC_logo.svg.png', countryOrConfederation: 'AFC / Saudi Arabia', league: 'Saudi Pro League' },
  { name: 'Al-Nassr', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d7/Al-Nassr_FC_logo.svg/1200px-Al-Nassr_FC_logo.svg.png', countryOrConfederation: 'AFC / Saudi Arabia', league: 'Saudi Pro League' },
  { name: 'Al-Ittihad', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/90/Al-Ittihad_Club_logo.svg/1200px-Al-Ittihad_Club_logo.svg.png', countryOrConfederation: 'AFC / Saudi Arabia', league: 'Saudi Pro League' },
  { name: 'Urawa Red Diamonds', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f7/Urawa_Red_Diamonds_logo.svg/1200px-Urawa_Red_Diamonds_logo.svg.png', countryOrConfederation: 'AFC / Japan', league: 'J1 League' },
  { name: 'Ulsan HD FC', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9e/Ulsan_Hyundai_FC_logo.svg/1200px-Ulsan_Hyundai_FC_logo.svg.png', countryOrConfederation: 'AFC / South Korea', league: 'K League 1' },
  // CAF
  { name: 'Al Ahly', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a3/Al_Ahly_SC_logo.svg/1200px-Al_Ahly_SC_logo.svg.png', countryOrConfederation: 'CAF / Egypt', league: 'Egyptian Premier League' },
  { name: 'Zamalek', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2f/Zamalek_SC_logo.svg/1200px-Zamalek_SC_logo.svg.png', countryOrConfederation: 'CAF / Egypt', league: 'Egyptian Premier League' },
  { name: 'Wydad Casablanca', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/77/Wydad_AC_logo.svg/1200px-Wydad_AC_logo.svg.png', countryOrConfederation: 'CAF / Morocco', league: 'Botola' },
  { name: 'Raja Casablanca', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5d/Raja_Club_Athletic_logo.svg/1200px-Raja_Club_Athletic_logo.svg.png', countryOrConfederation: 'CAF / Morocco', league: 'Botola' },
  { name: 'Espérance de Tunis', type: 'club', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8b/Esp%C3%A9rance_Sportive_de_Tunis_logo.svg/1200px-Esp%C3%A9rance_Sportive_de_Tunis_logo.svg.png', countryOrConfederation: 'CAF / Tunisia', league: 'Ligue Professionnelle 1' },

  // ===============================================================================================
  // National Teams
  // ===============================================================================================
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
  { name: 'Costa Rica', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/8/8d/Costa_Rica_national_football_team_crest.svg', countryOrConfederation: 'CONCACAF' },
  { name: 'Honduras', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/4/41/Honduras_national_football_team_crest.svg', countryOrConfederation: 'CONCACAF' },
  { name: 'Panama', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Panamanian_Football_Federation_logo.svg', countryOrConfederation: 'CONCACAF' },
  { name: 'Mexico', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f9/Mexico_national_football_team_seal.svg', countryOrConfederation: 'CONCACAF' },
  { name: 'United States', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Crest_of_the_United_States_Soccer_Federation.svg', countryOrConfederation: 'CONCACAF' },
  { name: 'Canada', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/c/c5/Canada_Soccer_Association_logo.svg', countryOrConfederation: 'CONCACAF' },

  // CAF
  { name: 'Nigeria', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f3/Nigeria_national_football_team_logo.svg', countryOrConfederation: 'CAF' },
  { name: 'Cameroon', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/4/47/Cameroon_national_football_team_logo.svg', countryOrConfederation: 'CAF' },
  { name: 'Ivory Coast', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/e/e6/C%C3%B4te_d%27Ivoire_national_football_team_crest.svg', countryOrConfederation: 'CAF' },
  { name: 'Ghana', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Ghana_national_football_team_seal.svg', countryOrConfederation: 'CAF' },
  { name: 'Senegal', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/6/69/Senegal_national_football_team_crest.svg', countryOrConfederation: 'CAF' },
  { name: 'Mali', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a5/Mali_national_football_team_crest.svg', countryOrConfederation: 'CAF' },
  { name: 'Togo', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/f/fa/Togo_national_football_team_crest.svg', countryOrConfederation: 'CAF' },
  { name: 'Tunisia', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/c/ce/Tunisia_national_football_team_crest.svg', countryOrConfederation: 'CAF' },
  { name: 'Algeria', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/4/41/Algeria_national_football_team_crest.svg', countryOrConfederation: 'CAF' },
  { name: 'Egypt', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a2/Egypt_national_football_team_logo.svg', countryOrConfederation: 'CAF' },
  { name: 'Morocco', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/4/4c/Morocco_national_football_team_logo.svg', countryOrConfederation: 'CAF' },
  { name: 'South Africa', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/2/28/South_Africa_national_football_team_logo_2019.svg', countryOrConfederation: 'CAF' },
  
  // AFC / OFC
  { name: 'Japan', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/7/70/Japan_national_football_team_crest.svg', countryOrConfederation: 'AFC' },
  { name: 'South Korea', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/1/13/South_Korea_national_football_team_logo.svg', countryOrConfederation: 'AFC' },
  { name: 'North Korea', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/6/6c/North_Korea_national_football_team_logo.svg', countryOrConfederation: 'AFC' },
  { name: 'Saudi Arabia', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/0/0d/Saudi_Arabia_national_football_team_logo.svg', countryOrConfederation: 'AFC' },
  { name: 'Iran', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/c/ca/Iran_national_football_team_logo.svg', countryOrConfederation: 'AFC' },
  { name: 'Iraq', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/c/c9/Iraq_national_football_team_logo.svg', countryOrConfederation: 'AFC' },
  { name: 'Qatar', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/e/e0/Qatar_national_football_team_logo.svg', countryOrConfederation: 'AFC' },
  { name: 'Australia', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/7/77/Football_Australia_logo.svg', countryOrConfederation: 'AFC' },
  { name: 'New Zealand', type: 'national', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/c/c5/New_Zealand_national_football_team_logo.svg', countryOrConfederation: 'OFC' },
];
