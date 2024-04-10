import * as OBC from "openbim-components";
import PieChartWithLabel, { IPieData } from "../../../react-component/charts/PieChartWithLabel";

export class PieCard extends OBC.SimpleUIComponent{
    
    set pieData(value: any){
        const htmlBox = this.getInnerElement("pieData") as HTMLDivElement;
        htmlBox.appendChild(value);
    }

    declare slots: {"pieChart": OBC.SimpleUIComponent};

    constructor(components: OBC.Components, pieData: IPieData[]){
        var template = `
            <div style="display:flex; justify-content:center; align-items:center" data-tooeen-slot="pieData">

            </div>
        `
        super(components, template);
        
       
        var test = new OBC.SimpleUIComponent(components);
        //test.addChild(pie);
        this.setSlot("pieData", new OBC.SimpleUIComponent(components));
        //this.slots.pieChart.addChild(pie)

        
    }
} 