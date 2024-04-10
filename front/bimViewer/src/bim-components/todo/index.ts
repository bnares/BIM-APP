import * as OBC from "openbim-components";
import * as THREE from "three";
import { ToDoCard } from "./src/ToDoCard";
import { FragmentsGroup } from "bim-fragment";
import { ViewerContext } from "../../react-component/ReactBimContext";
import React from "react";


export type ToDoStatus = "Pending" | "Active" | "Finished";

export interface ColorizeBtnStatus  {
    active: Boolean,
}

export interface ToDoData{
    description: string,
    status: ToDoStatus,
    fragmentMap : OBC.FragmentIdMap,
    date: Date,
    camera : {position: THREE.Vector3, target: THREE.Vector3},
    globalId: string[],
    fileName: string,
    //globalId: string;
}

export interface OnToDoCreated{
    description: string,
    status: ToDoStatus,
}

export class ToDoCreator extends OBC.Component<ToDoData[]> implements OBC.UI, OBC.Disposable{
    
    static uuid : string = "ea113616-0ad5-4800-b42a-a3a66c8cbc01";
    uiElement = new OBC.UIElement<{
        activationButton:OBC.Button,
        floatingWindow: OBC.FloatingWindow,
    }>;
    enabled: boolean = true;
    private _listToDo : ToDoData[] = [];
    private _components : OBC.Components;
    //private _model : FragmentsGroup | null;
    onToDoFormAccepted = new OBC.Event<OnToDoCreated>();
    onColorizeBtnClick = new OBC.Event<ColorizeBtnStatus>();
    //const {model, setModel} = React.useContext(ViewerContext);

    constructor(components : OBC.Components){
        super(components);
        this._components = components;
        components.tools.add(ToDoCreator.uuid, this);
        //this._model = model;
        this.setUI();
        //console.log("Added _model in tools: ",this._model);
        
    }

    public setup =async ()=>{
        const highlighter = await this._components.tools.get(OBC.FragmentHighlighter);
        highlighter.add(`${ToDoCreator.uuid}-Pending`, [new THREE.MeshStandardMaterial({color:0x59bc59})]);
        highlighter.add(`${ToDoCreator.uuid}-Active`, [new THREE.MeshStandardMaterial({color:0x597cff})]);
        highlighter.add(`${ToDoCreator.uuid}-Finished`, [new THREE.MeshStandardMaterial({color:0xff7676})]);
    }

    private setUI =()=>{
        var activationButton = new OBC.Button(this._components);
        activationButton.materialIcon = "construction";
        activationButton.tooltip="Add ToDo";

        const createBtn = new OBC.Button(this._components, {name:"Create"});
        activationButton.addChild(createBtn);
        createBtn.onClick.add(()=>{
            taskForm.visible = true;
        })

        const taskForm = new OBC.Modal(this._components, "Add Task");
        taskForm.visible = false;
        taskForm.slots.content.get().style.padding="20px";
        taskForm.slots.content.get().style.display="flex";
        taskForm.slots.content.get().style.flexDirection="column";
        taskForm.slots.content.get().style.justifyContent="center";
        taskForm.slots.content.get().style.rowGap="20px";
        this._components.ui.add(taskForm);

        var dropDown = new OBC.Dropdown(this._components)
        dropDown.addOption("Pending", "Active", "Finished");
        dropDown.label = "Select Status";
        dropDown.value = "Pending";
        taskForm.slots.content.addChild(dropDown);
        
        var inputText = new OBC.TextArea(this._components);
        inputText.label = "Description";
        taskForm.slots.content.addChild(inputText);
        
        

        taskForm.onCancel.add(()=>{
            taskForm.visible = false;
        })

        taskForm.onAccept.add(()=>{
            if(!dropDown.value) return;
            this.onToDoFormAccepted.trigger({status:dropDown.value as ToDoStatus, description: inputText.value});
            //this.addToDo(dropDown.value as ToDoStatus, inputText.value);
            inputText.value="";
            taskForm.visible = false;
        })

        const seeList = new OBC.Button(this._components,{name:'View'});
        activationButton.addChild(seeList);
        seeList.onClick.add(()=>{
            floatingWindow.visible = !floatingWindow.visible;
        })



        var floatingWindow = new OBC.FloatingWindow(this._components);
        floatingWindow.title = "Added Tasks";
        floatingWindow.visible = false;
        floatingWindow.active = false;
        const toolbarWindow = new OBC.SimpleUIComponent(this._components);
        const colorizeBtn = new OBC.Button(this._components);
        colorizeBtn.tooltip = "Colorize";
        colorizeBtn.materialIcon="palette";
        toolbarWindow.addChild(colorizeBtn);
        floatingWindow.addChild(toolbarWindow);
        this._components.ui.add(floatingWindow);

        colorizeBtn.onClick.add(async ()=>{
            colorizeBtn.active = !colorizeBtn.active;
            this.onColorizeBtnClick.trigger({active:colorizeBtn.active});
            // const highlighter = await this._components.tools.get(OBC.FragmentHighlighter);
            // colorizeBtn.active = !colorizeBtn.active;
            // if(colorizeBtn.active){

            // }
        })

        this.uiElement.set({activationButton, floatingWindow});
    }

    


    get(): ToDoData[] {
        return this._listToDo
    }

    dispose = async ()=>{
        await this.uiElement.dispose();
        //this._model = null;
        this.enabled = false;
        
    };

}  