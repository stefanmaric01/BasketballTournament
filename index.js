const groups = require('./groups.json');


function simulateMatch(team1, team2) {
    
    if (!team1 || !team2) {
        console.error(`Error: One or both teams are undefined.`);
        return {
            team1Score: 0,
            team2Score: 0,
            result: [0, 0],
            team1: team1 ? team1.Team : 'Undefined',
            team2: team2 ? team2.Team : 'Undefined'
        };
    }

    
    const scoreDifference = team2.FIBARanking - team1.FIBARanking;

   
    const baseScore = 80; 
    const team1Score = baseScore + Math.floor(Math.random() * 20) + scoreDifference;
    const team2Score = baseScore + Math.floor(Math.random() * 20) - scoreDifference;

   
    const result = team1Score > team2Score ? [2, 1] : [1, 2];

    return {
        team1Score,
        team2Score,
        result,
        team1: team1.Team,
        team2: team2.Team
    };
}



function simulateGroupPhase() {
    const groupResults = {};

    for (const group in groups) {
        const teams = groups[group];

        if (!Array.isArray(teams)) {
            console.error(`Group ${group} is not an array.`);
            continue;
        }

      
        teams.forEach(team => {
            team.points = 0;
            team.wins = 0;
            team.losses = 0;
            team.pointDifference = 0;
            team.pointsFor = 0;
            team.pointsAgainst = 0;
        });

        groupResults[group] = [];
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                const matchResult = simulateMatch(teams[i], teams[j]);

                groupResults[group].push({
                    team1: matchResult.team1,
                    team2: matchResult.team2,
                    score: `${matchResult.team1Score}:${matchResult.team2Score}`,
                    points: matchResult.result
                });

                teams[i].pointsFor += matchResult.team1Score;
                teams[i].pointsAgainst += matchResult.team2Score;
                teams[i].pointDifference = teams[i].pointsFor - teams[i].pointsAgainst;
                teams[i].points += matchResult.result[0];
                teams[i].wins += matchResult.result[0] === 2 ? 1 : 0;
                teams[i].losses += matchResult.result[1] === 2 ? 1 : 0;

                teams[j].pointsFor += matchResult.team2Score;
                teams[j].pointsAgainst += matchResult.team1Score;
                teams[j].pointDifference = teams[j].pointsFor - teams[j].pointsAgainst;
                teams[j].points += matchResult.result[1];
                teams[j].wins += matchResult.result[1] === 2 ? 1 : 0;
                teams[j].losses += matchResult.result[0] === 2 ? 1 : 0;
            }
        }

        
        teams.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.pointDifference !== a.pointDifference) return b.pointDifference - a.pointDifference;
            return b.pointsFor - a.pointsFor;
        });
    }

    return groupResults;
}


function printResults(groupResults) {
    console.log('Grupna faza - rezultati:');

    for (const group in groupResults) {
        console.log(`Grupa ${group}:`);
        groupResults[group].forEach(match => {
            console.log(`    ${match.team1} - ${match.team2} (${match.score})`);
        });
    }

    console.log('\nKonačan plasman u grupama:');
    for (const group in groups) {
        console.log(`    Grupa ${group}:`);
        groups[group].sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.pointDifference !== a.pointDifference) return b.pointDifference - a.pointDifference;
            return b.pointsFor - a.pointsFor;
        }).forEach((team, index) => {
            console.log(`        ${index + 1}. ${team.Team} - ${team.points} bodova - ${team.FIBARanking} FIBA rang`);
        });
    }
}


function createPots(groupResults) {
    const allTeams = [];


    for (const group in groupResults) {
        groupResults[group].forEach(match => {
            const team1 = groups[group].find(t => t.Team === match.team1);
            const team2 = groups[group].find(t => t.Team === match.team2);

            if (team1 && !allTeams.includes(team1)) allTeams.push(team1);
            if (team2 && !allTeams.includes(team2)) allTeams.push(team2);
        });
    }


    allTeams.sort((a, b) => b.points - a.points || a.FIBARanking - b.FIBARanking);


    const topTeams = allTeams.slice(0, 8);

    const pots = { D: [], E: [], F: [], G: [] };

    pots.D.push(topTeams[0], topTeams[1]); 
    pots.E.push(topTeams[2], topTeams[3]); 
    pots.F.push(topTeams[4], topTeams[5]); 
    pots.G.push(topTeams[6], topTeams[7]); 

    return pots;
}

function simulateKnockoutStage(pots) {
    const quarterFinals = [];
    const semiFinals = [];
    const finalMatch = [];
    const bronzeMatch = [];

    const teams = {
        D: pots.D,
        E: pots.E,
        F: pots.F,
        G: pots.G
    };

    if (Object.keys(teams).some(pot => teams[pot].length < 2)) {
        console.error("Nema dovoljno timova u šeširima za eliminacionu fazu.");
        return { quarterFinals: [], semiFinals: [], finalMatch: [], bronzeMatch: [] };
    }

   
    quarterFinals.push(simulateMatch(teams.E[0], teams.F[1]));
    quarterFinals.push(simulateMatch(teams.D[0], teams.G[1]));
    quarterFinals.push(simulateMatch(teams.D[1], teams.G[0]));
    quarterFinals.push(simulateMatch(teams.E[1], teams.F[0]));

  
    const winnersQF = [];
    const losersQF = [];

    quarterFinals.forEach(match => {
        if (match.team1Score > match.team2Score) {
            winnersQF.push(teams.D.find(team => team.Team === match.team1) || teams.E.find(team => team.Team === match.team1) || teams.F.find(team => team.Team === match.team1) || teams.G.find(team => team.Team === match.team1));
            losersQF.push(teams.D.find(team => team.Team === match.team2) || teams.E.find(team => team.Team === match.team2) || teams.F.find(team => team.Team === match.team2) || teams.G.find(team => team.Team === match.team2));
        } else {
            winnersQF.push(teams.D.find(team => team.Team === match.team2) || teams.E.find(team => team.Team === match.team2) || teams.F.find(team => team.Team === match.team2) || teams.G.find(team => team.Team === match.team2));
            losersQF.push(teams.D.find(team => team.Team === match.team1) || teams.E.find(team => team.Team === match.team1) || teams.F.find(team => team.Team === match.team1) || teams.G.find(team => team.Team === match.team1));
        }
    });

    console.log("Winners QF:", winnersQF);
    console.log("Losers QF:", losersQF);

  
    semiFinals.push(simulateMatch(winnersQF[0], winnersQF[1]));
    semiFinals.push(simulateMatch(winnersQF[2], winnersQF[3]));

   
    const winnersSF = [];
    const losersSF = [];

    semiFinals.forEach(match => {
        if (match.team1Score > match.team2Score) {
            winnersSF.push(winnersQF.find(team => team.Team === match.team1));
            losersSF.push(winnersQF.find(team => team.Team === match.team2));
        } else {
            winnersSF.push(winnersQF.find(team => team.Team === match.team2));
            losersSF.push(winnersQF.find(team => team.Team === match.team1));
        }
    });

    console.log("Winners SF:", winnersSF);
    console.log("Losers SF:", losersSF);


    bronzeMatch.push(simulateMatch(losersSF[0], losersSF[1]));


    finalMatch.push(simulateMatch(winnersSF[0], winnersSF[1]));

    return { quarterFinals, semiFinals, finalMatch, bronzeMatch };
}


function printKnockoutStageResults(quarterFinals, semiFinals, bronzeMatch, finalMatch) {
    console.log('\nČetvrtfinale:');
    quarterFinals.forEach((match, index) => {
        console.log(`    Četvrtfinale ${index + 1}: ${match.team1} - ${match.team2} (${match.team1Score}:${match.team2Score})`);
    });

    console.log('\nPolufinale:');
    semiFinals.forEach((match, index) => {
        console.log(`    Polufinale ${index + 1}: ${match.team1} - ${match.team2} (${match.team1Score}:${match.team2Score})`);
    });

    console.log('\nUtakmica za treće mesto:');
    bronzeMatch.forEach((match) => {
        console.log(`    Utakmica za treće mesto: ${match.team1} - ${match.team2} (${match.team1Score}:${match.team2Score})`);
    });

    console.log('\nFinale:');
    finalMatch.forEach((match) => {
        console.log(`    Finale: ${match.team1} - ${match.team2} (${match.team1Score}:${match.team2Score})`);
    });

    const firstPlace = finalMatch[0].team1Score > finalMatch[0].team2Score ? finalMatch[0].team1 : finalMatch[0].team2;
    const secondPlace = finalMatch[0].team1Score > finalMatch[0].team2Score ? finalMatch[0].team2 : finalMatch[0].team1;
    const thirdPlace = bronzeMatch[0].team1Score > bronzeMatch[0].team2Score ? bronzeMatch[0].team1 : bronzeMatch[0].team2;

    console.log('\nMedalje:');
    console.log(`1.: ${firstPlace}`);
    console.log(`2.: ${secondPlace}`);
    console.log(`3.: ${thirdPlace}`);
}


function startTournament() {
    const groupResults = simulateGroupPhase();
    printResults(groupResults);

    const pots = createPots(groupResults);

    if (Object.keys(pots).length === 0) {
        console.log('Ne može se nastaviti sa eliminacionom fazom zbog nedostatka timova.');
        return;
    }

    console.log('\nŠeširi:');
    for (const pot in pots) {
        console.log(`    Šešir ${pot}`);
        pots[pot].forEach(team => {
            console.log(`        ${team.Team}`);
        });
    }

    const { quarterFinals, semiFinals, finalMatch, bronzeMatch } = simulateKnockoutStage(pots);

    if (quarterFinals.length > 0) {
        printKnockoutStageResults(quarterFinals, semiFinals, bronzeMatch, finalMatch);
    }
}

startTournament();
