import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

    console.log('FlavorCode is now active!');

    // --- 1. SETUP VISUALS (CSS & StatusBar) ---

    // Style for the "Salty" red line (Roast)
    const saltyDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 0, 0, 0.2)',
        isWholeLine: true,
        after: {
            contentText: ' 🌶️ Is that all you got?',
            color: 'rgba(255, 100, 100, 0.8)',
            fontStyle: 'italic'
        }
    });

    // Status Bar for the Score
    const myStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    myStatusBar.text = "$(flame) Flavor Score: 0";
    myStatusBar.tooltip = "Productivity Score";
    myStatusBar.show();
    context.subscriptions.push(myStatusBar);

    // --- 2. GAME VARIABLES ---

    let sessionStartTime = Date.now();
    let saveCounter = 0;
    let pasteTimestamps: number[] = []; // Stores times of paste events
    
    // Achievement Tracking (to avoid spamming the same badge)
    let badges = {
        marathon: false,
        copyPaster: false,
        destroyer: false,
        nightOwl: false,
        novelist: false
    };

    // --- 3. MARATHONER BADGE (Check every minute) ---
    
    // Checks every 60 seconds if the user has been coding for 2 hours
    setInterval(() => {
        const timeElapsed = Date.now() - sessionStartTime;
        const hoursPlayed = timeElapsed / (1000 * 60 * 60); // Convert ms to hours

        if (hoursPlayed >= 2 && !badges.marathon) {
            badges.marathon = true;
            vscode.window.showInformationMessage(`🏆 BADGE UNLOCKED: "Marathoner" (2 hours non-stop!)`);
            updateScore(500); // Big points
        }
    }, 60000); // Run every minute

    // --- 4. EVENT LISTENERS ---

    // A. When text changes (Type, Paste, Delete)
    let changeDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
        
        // Loop through each change in the event
        event.contentChanges.forEach(change => {
            
            // --- BADGE: DESTROYER (Deleted 500 lines) ---
            // Calculate how many lines were covered by the change range
            const linesDeleted = change.range.end.line - change.range.start.line;
            
            // If text is empty (deletion) and covers > 500 lines
            if (change.text === '' && linesDeleted >= 500 && !badges.destroyer) {
				const range = new vscode.Range(0, 0, 0, 0);
                activeEditor.setDecorations(saltyDecorationType, [range]);
                badges.destroyer = true;
                vscode.window.showWarningMessage(`🏆 BADGE UNLOCKED: "The Destroyer" (Deleted 500+ lines at once!)`);
                updateScore(100);
            }

            // --- BADGE: COPY-PASTER (10 pastes in 1 min) ---
            // Heuristic: If inserted text is longer than 5 chars, we assume it's a Paste (not typing)
            if (change.text.length > 5) {
                const now = Date.now();
                pasteTimestamps.push(now);

                // Filter: Keep only pastes from the last 60 seconds
                pasteTimestamps = pasteTimestamps.filter(t => now - t < 60000);

                if (pasteTimestamps.length >= 10 && !badges.copyPaster) {
                    badges.copyPaster = true;
                    vscode.window.showInformationMessage(`🏆 BADGE UNLOCKED: "Copy-Paster" (Ctrl+V is your passion)`);
                    updateScore(50);
                }
            }
        });
    });

    // B. When saving (The Roast + Other Badges)
    let saveDisposable = vscode.workspace.onDidSaveTextDocument((document) => {
        saveCounter++;
        updateScore(10); // +10 points per save

        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            const lineCount = document.lineCount;

            // --- ROAST LOGIC (English) ---
            if (lineCount < 5) {
                const range = new vscode.Range(0, 0, 0, 0);
                activeEditor.setDecorations(saltyDecorationType, [range]);
                
                const insults = [
                    "Is that it? My grandma codes more than that.",
                    "Don't strain yourself...",
                    "File or Post-it note?",
                    "Code harder, human."
                ];
                const randomInsult = insults[Math.floor(Math.random() * insults.length)];
                vscode.window.showErrorMessage(`🧂 SALTY: ${randomInsult}`);
            } else {
                activeEditor.setDecorations(saltyDecorationType, []);
            }

            // --- BADGE: NOVELIST (> 100 lines) ---
            if (lineCount > 100 && !badges.novelist) {
                badges.novelist = true;
                vscode.window.showInformationMessage(`🏆 BADGE UNLOCKED: "Novelist" (100+ lines of code)`);
                updateScore(100);
            }

            // --- BADGE: NIGHT OWL (00h - 05h) ---
            const currentHour = new Date().getHours();
            if (currentHour >= 0 && currentHour < 5 && !badges.nightOwl) {
                badges.nightOwl = true;
                vscode.window.showInformationMessage(`🏆 BADGE UNLOCKED: "Night Owl" (Go to sleep!)`);
                updateScore(200);
            }
        }
    });

    // Helper function to update score display
    function updateScore(points: number) {
        // Parse current score from the label (simple way)
        // Format is "$(flame) Flavor Score: 123"
        let currentText = myStatusBar.text.split(': ')[1];
        let currentScore = parseInt(currentText) || 0;
        let newScore = currentScore + points;
        myStatusBar.text = `$(flame) Flavor Score: ${newScore}`;
    }

    context.subscriptions.push(saveDisposable);
    context.subscriptions.push(changeDisposable);
    context.subscriptions.push(saltyDecorationType);
}

export function deactivate() {}