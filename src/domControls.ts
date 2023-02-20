import { DatabaseReference, remove, update } from "firebase/database";

class DomControls {
    mainScreen: HTMLDivElement;
    joinButton: HTMLButtonElement;
    helpButton: HTMLButtonElement;
    helpModalCloseButton: HTMLButtonElement;
    helpModal: HTMLDivElement;
    waitingModal: HTMLDivElement;
    cancelWaitingButton: HTMLButtonElement;
    gameScreen: HTMLDivElement;
    giveupButton: HTMLButtonElement;

    constructor() {
        this.mainScreen = document.querySelector('.main-screen')!;
        this.joinButton = document.querySelector('.start-btn')!;
        this.helpButton = document.querySelector('.help-btn')!;
        this.helpModalCloseButton = document.querySelector('.help-modal-close-btn')!;
        this.helpModal = document.querySelector('.help-modal')!;
        this.waitingModal = document.querySelector('.waiting-modal')!;
        this.cancelWaitingButton = document.querySelector('.cancel-waiting-btn')!;
        this.gameScreen = document.querySelector('.game-screen')!;
        this.giveupButton = document.querySelector('.giveup-btn')!;
    }

    setupMainScreen = () => {
        this.helpButton.addEventListener('click', () => {
            this.helpModal.classList.remove('hide');
            this.joinButton.disabled = true;
        });
        this.helpModalCloseButton.addEventListener('click', () => {
            this.helpModal.classList.add('hide');
            this.joinButton.disabled = false;
        })
    }
    
    setupJoinButton = (joinRoom: () => void) => {
        this.joinButton = <HTMLButtonElement>document.querySelector('.start-btn');
        this.joinButton.disabled = false;
        this.joinButton.addEventListener('click', () => {
            this.joinButton.disabled = true;
            joinRoom();
        });
    }

    onCancelWaitingButtonClicked = (uref: DatabaseReference) => {
        this.joinButton.disabled = false;
        remove(uref);
        this.waitingModal.classList.add('hide');
        this.cancelWaitingButton.removeEventListener('click', () => this.onCancelWaitingButtonClicked(uref));
    }

    setupWaitingModal = (uref: DatabaseReference) => {
        this.waitingModal.classList.remove('hide');
        this.cancelWaitingButton.addEventListener('click', () => this.onCancelWaitingButtonClicked(uref));
    }

    setupGameScreen = (ridref: DatabaseReference, playerColor: string) => {
        this.mainScreen.classList.add('hide');
        this.gameScreen.classList.remove('hide');

        this.giveupButton.addEventListener('click', () => {
            const ok = confirm("Are you sure you want to give up?");
            if (ok) {
                update(ridref, { winner: playerColor === "W" ? "B" : "W" });
            }
        });
    }
}



export default DomControls;