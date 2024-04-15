import * as OBC from "openbim-components";
import * as WEBIFC from "web-ifc";
import PieChartWithLabel, { IPieData } from "../../react-component/charts/PieChartWithLabel";
import { ToDoData } from "../todo";
import { IfcProperties } from "bim-fragment";

type QtoStatus = {[label: string] : number}

export class ChartsCreator extends OBC.Component<IPieData[]> implements OBC.UI{
    onUiElementBtnClicked = new OBC.Event();
    static uuid: string = "7ca391b1-cf67-4b5a-abcf-ec425290b888";
    uiElement = new  OBC.UIElement <{
        activationButton: OBC.Button,
        chartsWindow: OBC.FloatingWindow,
    }>;
    enabled: boolean = true;
    private _components: OBC.Components;
    private _pieData: IPieData[] = [];

    constructor(components: OBC.Components, toDoData: ToDoData[]){
        super(components);
        this._components = components;
        components.tools.add(ChartsCreator.uuid, this);
        this.preparePieDataToDisplay(toDoData);
        //this.uiElement.get("chartsWindow").get().append()
    }

    countNumberOfElementsTypeInModel(properites: IfcProperties){
        //var test = OBC.IfcPropertiesUtils.groupEntitiesByType(properites,expressIds);
        var beamsNUmber = OBC.IfcPropertiesUtils.getAllItemsOfType(properites, WEBIFC.IFCBEAM);
        //console.log("beams:", beamsNUmber);
        var slabNumber = OBC.IfcPropertiesUtils.getAllItemsOfType(properites, WEBIFC.IFCSLAB);
        //console.log("slab:", slabNumber);
        var wallNumber = OBC.IfcPropertiesUtils.getAllItemsOfType(properites, WEBIFC.IFCWALL);
        //console.log("wall:", wallNumber);
        var columns = OBC.IfcPropertiesUtils.getAllItemsOfType(properites, WEBIFC.IFCCOLUMN);
        //console.log("columns: ", columns);
        return {Beams:beamsNUmber.length, Slabs: slabNumber.length, Walls:wallNumber.length, Columns:columns.length};
    }

    private preparePieDataToDisplay(toDoData:ToDoData[]){
        const data: QtoStatus[]=[];
        //const pieData : IPieData[] = [];
        var allNamesOfStatus : string[]= [];
        for(var modelElementInfo of toDoData){
            var label = modelElementInfo.status as string;
            var elementAsignedToStatus = modelElementInfo.globalId.length;
            if(!allNamesOfStatus.filter(x=>x==label)){
                var newData : QtoStatus = {label:elementAsignedToStatus};
                data.push(newData);
            }else{
                for(var statusInfo of data){
                    if(Object.keys(statusInfo).includes(label)){
                        statusInfo[label] = statusInfo[label]+elementAsignedToStatus;
                    }
                }
            }
        }
        var colorsPie = ["#0088FE", '#00C49F','#FFBB28','#FF8042']
        var count = 0
        for(var statusCount of data){
            var pie = {label: statusCount.label.toString(), value: Number(statusCount.value), color:colorsPie[count]};
            count++;
            this._pieData.push(pie);
            if(count>=4) count = 0;

        }

    }

    public setUI(){
        var button = new OBC.Button(this.components);
        button.tooltip = "Charts";
        button.materialIcon = "pie_chart";

        button.onClick.add(()=>{
            console.log("inside charts index clicked");
            this.onUiElementBtnClicked.trigger();
            //chartsWindow.visible = !chartsWindow.visible;
        })

        var chartsWindow = new OBC.FloatingWindow(this.components);
        chartsWindow.title = "Charts";
        chartsWindow.visible = false;
        this.components.ui.add(chartsWindow);
        this.uiElement.set({activationButton:button, chartsWindow});
        
    }

    get(): IPieData[] {
        return this._pieData;
    }

}