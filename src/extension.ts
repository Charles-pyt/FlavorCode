import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

    console.log('FlavorCode is now active!');

    // --- 1. SETUP VISUALS (CSS & StatusBar) ---

    const saltyDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 0, 0, 0.2)',
        isWholeLine: true,
        after: {
            contentText: ' 🌶️ Is that all you got?',
            color: 'rgba(255, 100, 100, 0.8)',
            fontStyle: 'italic'
        }
    });

    const partyDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(0, 255, 0, 0.3)',
        borderRadius: '4px',
        after: {
            contentText: ' 🎉 Party Time!',
            color: '#7fdbca',
            fontWeight: 'bold'
        }
    });

    const myStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    myStatusBar.tooltip = "Flavor Score | Combo Meter";
    // Important : On l'affiche tout de suite
    myStatusBar.show();
    context.subscriptions.push(myStatusBar);

    // --- 2. GAME VARIABLES ---

    let sessionStartTime = Date.now();
    let saveCounter = 0;
    
    // --- CORRECTION ICI : La variable manquante ajoutée ---
    let currentScore = 0; 
    
    // --- CORRECTION ICI : Une seule déclaration pour pasteTimestamps ---
    let pasteTimestamps: number[] = []; 

    // Combo Variables
    let comboCount = 0;
    let lastKeystrokeTime = 0;
    let maxCombo = 0;
    
    let badges = {
        marathon: false,
        copyPaster: false,
        destroyer: false,
        nightOwl: false,
        novelist: false,
        godMode: false,
    };

    // On met à jour l'affichage initial (maintenant que currentScore existe)
    updateDisplay();

    // --- 3. TIMERS ---

    // Marathoner Check
    setInterval(() => {
        const timeElapsed = Date.now() - sessionStartTime;
        const hoursPlayed = timeElapsed / (1000 * 60 * 60); 

        if (hoursPlayed >= 2 && !badges.marathon) {
            badges.marathon = true;
            vscode.window.showInformationMessage(`🏆 BADGE UNLOCKED: "Marathoner" (2 hours non-stop!)`);
            addScore(500); 
        }
    }, 60000); 

    // Combo Decay
    setInterval(() => {
        const now = Date.now();
        if (now - lastKeystrokeTime > 2000 && comboCount > 0) {
            comboCount = 0;
            updateDisplay();
        }
    }, 1000);

    // --- 4. EVENT LISTENERS ---

    // A. TYPING & EDITING LOGIC
    let changeDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
        
        const now = Date.now();
        const activeEditor = vscode.window.activeTextEditor;

        // --- COMBO LOGIC ---
        if (now - lastKeystrokeTime < 1500) {
            comboCount++;
            if (comboCount > maxCombo) { maxCombo = comboCount; }
            
            if (comboCount > 100 && !badges.godMode) {
                badges.godMode = true;
                vscode.window.showInformationMessage(`🔥 BADGE UNLOCKED: "God Mode" (100 Combo!)`);
                addScore(1000);
            }
        } else {
            comboCount = 1; 
        }
        lastKeystrokeTime = now;
        updateDisplay();

        // --- CONTENT ANALYSIS ---
        event.contentChanges.forEach(change => {
            
            // 1. EASTER EGGS
            const text = change.text.toLowerCase();
            
            if (text.includes('hackclub')) {
                vscode.window.showInformationMessage('🚀 HACK CLUB ASSEMBLE!');
                addScore(50);
            }
            if (text.includes('pizza')) {
                 vscode.window.showInformationMessage('🍕 Did someone say Flavor Town?');
            }
            if (text.includes('bug')) {
                vscode.window.setStatusBarMessage('🐛 Eww, a bug!', 3000);
            }

            // 2. BADGE: DESTROYER
            const linesDeleted = change.range.end.line - change.range.start.line;
            if (change.text === '' && linesDeleted >= 500 && !badges.destroyer) {
                badges.destroyer = true;
                vscode.window.showWarningMessage(`🏆 BADGE UNLOCKED: "The Destroyer" (Deleted 500+ lines!)`);
                addScore(100);
            }

            // 3. BADGE: COPY-PASTER
            if (change.text.length > 5) {
                pasteTimestamps.push(now);
                pasteTimestamps = pasteTimestamps.filter(t => now - t < 60000);
                if (pasteTimestamps.length >= 10 && !badges.copyPaster) {
                    badges.copyPaster = true;
                    vscode.window.showInformationMessage(`🏆 BADGE UNLOCKED: "Copy-Paster" (Ctrl+V Master)`);
                    addScore(50);
                }
            }
        });
    });

    // B. SAVING LOGIC
    let saveDisposable = vscode.workspace.onDidSaveTextDocument((document) => {
        addScore(10); 

        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            const lineCount = document.lineCount;

            // --- ROAST ---
            if (lineCount < 5) {
                const range = new vscode.Range(0, 0, 0, 0);
                activeEditor.setDecorations(saltyDecorationType, [range]);
                
                const insults = ["Is that it?", "Weak.", "My cat codes better.", "Try harder."];
                const randomInsult = insults[Math.floor(Math.random() * insults.length)];
                vscode.window.showErrorMessage(`🧂 SALTY: ${randomInsult}`);
            } else {
                activeEditor.setDecorations(saltyDecorationType, []);
            }

            // --- BADGES ---
            if (lineCount > 100 && !badges.novelist) {
                badges.novelist = true;
                vscode.window.showInformationMessage(`🏆 BADGE UNLOCKED: "Novelist"`);
                addScore(100);
            }

            const currentHour = new Date().getHours();
            if (currentHour >= 0 && currentHour < 5 && !badges.nightOwl) {
                badges.nightOwl = true;
                vscode.window.showInformationMessage(`🏆 BADGE UNLOCKED: "Night Owl"`);
                addScore(200);
            }
        }
    });

    // --- HELPER FUNCTIONS ---

    function addScore(points: number) {
        currentScore += points;
        updateDisplay();
    }

    function updateDisplay() {
        let fireIcon = "$(flame)";
        if (comboCount > 20) fireIcon = "🔥🔥";
        if (comboCount > 50) fireIcon = "🔥🔥🔥";
        if (comboCount > 100) fireIcon = "💥💥💥";

        myStatusBar.text = `${fireIcon} Score: ${currentScore} | Combo: ${comboCount}x`;
    }

    context.subscriptions.push(saveDisposable);
    context.subscriptions.push(changeDisposable);
    context.subscriptions.push(myStatusBar);
}

export function deactivate() {}