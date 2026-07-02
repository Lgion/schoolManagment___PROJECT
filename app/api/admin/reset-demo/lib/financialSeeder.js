export const generateFinancialsForClassYear = async (classe, activeStudentsDocs, year, getRandomDateInYear) => {
    // Les tarifs fixés dans SchoolSettings
    const feeConfig = {
        'scol': { 'Base': 350 },
        'cantine': { 'Demi-pensionnaire': 120, 'Externe': 0 },
        'transport': { 'Zone A': 80, 'Zone B': 120, 'Pas de transport': 0 }
    };

    for (const eleve of activeStudentsDocs) {
        if (!eleve.scolarity_fees_$_checkbox) {
            eleve.scolarity_fees_$_checkbox = {};
        }
        
        const paymentsThisYear = {}; // { [timestamp]: [{ feeId, amount, timestamp }] }
        
        const targets = eleve.targetsList || {};
        const activeTargets = Object.values(targets).flat();

        // Déterminer les montants dus pour cet élève
        const feesToPay = [];
        
        // 1. Scolarité
        if (activeTargets.includes('Base')) feesToPay.push({ feeId: 'scol', amount: 350 });
        // 2. Cantine
        if (activeTargets.includes('Demi-pensionnaire')) feesToPay.push({ feeId: 'cantine', amount: 120 });
        // 3. Transport
        if (activeTargets.includes('Zone A')) feesToPay.push({ feeId: 'transport', amount: 80 });
        else if (activeTargets.includes('Zone B')) feesToPay.push({ feeId: 'transport', amount: 120 });

        // Générer les paiements (échelonnés ou en une fois)
        for (const fee of feesToPay) {
            const paymentType = Math.random();
            let amounts = [];
            if (paymentType < 0.6) {
                // Paiement total en une fois
                amounts = [fee.amount];
            } else if (paymentType < 0.9) {
                // Paiement en 2 ou 3 fois
                const part1 = Math.floor(fee.amount / 2);
                const part2 = fee.amount - part1;
                amounts = [part1, part2];
            } else {
                // Retardataire (ne paie qu'une partie)
                amounts = [Math.floor(fee.amount * 0.7)];
            }

            for (const amt of amounts) {
                if (amt <= 0) continue;
                const paymentDate = getRandomDateInYear(year);
                // Mettre l'heure à 00:00:00 pour la clé ts du frontend
                const paymentDay = new Date(paymentDate);
                paymentDay.setHours(0, 0, 0, 0);
                const ts = paymentDay.getTime().toString();

                if (!paymentsThisYear[ts]) paymentsThisYear[ts] = [];
                paymentsThisYear[ts].push({
                    feeId: fee.feeId,
                    amount: amt,
                    timestamp: paymentDate.getTime()
                });
            }
        }

        eleve.scolarity_fees_$_checkbox[year] = paymentsThisYear;
    }
};
