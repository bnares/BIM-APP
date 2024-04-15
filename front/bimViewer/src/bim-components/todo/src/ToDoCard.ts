import * as OBC from "openbim-components"
import { ToDoStatus } from "..";

export interface StorageToDoInDb{
    camera:{target:object, position:object},
    date: string,
    description: string,
    fileName: string,
    fragmentMap: string,
    globalId: string,
    id: number,
    status: string,
}

export type idOfToDo = number;

export class ToDoCard extends OBC.SimpleUIComponent{


    private _idNumberOfToDoInDb: number  = 0;
    onCardClick = new  OBC.Event();
    onDeleteBtnClick = new OBC.Event<idOfToDo>();

    set date(value: Date){
        const htmlElem = this.getInnerElement("date") as HTMLParamElement;
        htmlElem.innerText = value.toDateString();
    }

    set description(value : string){
        const htmlElem = this.getInnerElement("description") as HTMLParagraphElement;
        htmlElem.innerText = value;
    }

    set status(value: ToDoStatus){
        const htmlElem = this.getInnerElement("status") as HTMLElement;
        htmlElem.innerHTML =  value.toString();
    }

    declare slots: { "actionButtons": OBC.SimpleUIComponent<HTMLElement>; };

    public getIdNumberOfToDo = ()=>{
        return this._idNumberOfToDoInDb;
    }


    constructor(components: OBC.Components, id = 0){
        
        const template = `
        <div class="todo-item" style="display:flex; justify-content: space-between; align-items: center" id=${id}>
            <div style="display: flex; justify-content: space-between; align-items: center; column-gap:1rem; width:100%">
                <div style="display: flex; column-gap: 15px; align-items: center;">
                    <span class="material-icons-outlined">
                        handyman
                    </span>
                    
                    <div>
                        <p id="date" style="text-wrap: nowrap; color: #a9a9a9; font-size: var(--font-sm)">Fri, 20 sep</p>
                        <p class="card-to-do-description" id="description">Make anything here as you want, even something longer.</p>
                    </div>
                </div>
                <div>
                    <p><b id="status">  </b> </p>
                </div>
                <div data-tooeen-slot="actionButtons"> 
                    data-tooeen-slot we tell the openBim engine that this is a slot with name actionButtons
                </div>
                
               
            </div>
        </div>
        `
        super(components, template);
        this._idNumberOfToDoInDb = id;
        this.setSlot("actionButtons", new OBC.SimpleUIComponent(this._components))

        const deleteBtn = new OBC.Button(this._components);
        deleteBtn.tooltip="Delete Note";
        deleteBtn.materialIcon="delete";
        this.slots.actionButtons.addChild(deleteBtn);

        deleteBtn.onClick.add(async ()=>{
            this.onDeleteBtnClick.trigger(this._idNumberOfToDoInDb ? this._idNumberOfToDoInDb : 0);
            //await this.dispose()
        })

        const uiCardElement = this.get();
        uiCardElement.addEventListener("click", ()=>{
            this.onCardClick.trigger(this);
        })

    }
}