import * as OBC from "openbim-components"
import { ToDoData, ToDoStatus } from "../bim-components/todo";
import * as THREE from "three";

export interface DataOfToDoRecivedFromDb{
    camera: string,
    date: string,
    description: string,
    fragmentMap:string,
    globalId: string,
    id: number,
    status: string,
    fileName: string,
}

export class Helper{

    static convertIfcToFragment = (fragmentManager : OBC.FragmentManager, fileName: string)=>{
        if(!fragmentManager.groups.length) return;
        const group = fragmentManager.groups[0];
        const modelProperties = group.properties;
        const modelPropsAsString = JSON.stringify(modelProperties);
        
        const propertiesBlob = new Blob([modelPropsAsString],{type:"application/json"});
        const fileJson = new File([propertiesBlob], fileName);
        this.download(fileJson, fileName);

        const dataFragment = fragmentManager.export(group);
        const blobFragment = new Blob([dataFragment]);
        const fileFragment = new File([blobFragment],fileName);
        this.download(fileFragment, `${fileName}.frag`);
    }

    private static  download = (file : File, downloadName: string) =>{
        const link = document.createElement("a");
        link.href = URL.createObjectURL(file);
        link.download = downloadName;
        document.body.appendChild(link);
        link.click();
        link.remove();
    }

    static CreateToDoDataObjectFromDbInfo = (dbData: DataOfToDoRecivedFromDb)=>{

        var camera = JSON.parse(dbData.camera);
        var target = new THREE.Vector3();
        target.x = camera.target.x;
        target.y = camera.target.y;
        target.z = camera.target.z;

        var position = new THREE.Vector3();
        position.x = camera.position.x;
        position.y = camera.position.y;
        position.z = camera.position.z;

        const fragmentMapFromDb = JSON.parse(dbData.fragmentMap);
        var framgnetMapWithSet : {[k:string]: Set<string>} = {};
        for(var fragmentKey of Object.keys(fragmentMapFromDb)){
            framgnetMapWithSet[fragmentKey] = new Set();
            for(var singleExpressId  of fragmentMapFromDb[fragmentKey]){
                framgnetMapWithSet[fragmentKey] = framgnetMapWithSet[fragmentKey].add(singleExpressId);
            }
        }
       

        var createdToDoData : ToDoData = {
            date : new Date(dbData.date),
            description : dbData.description,
            camera : {target, position},
            status: dbData.status as ToDoStatus,
            globalId : dbData.globalId.split(";"),
            fileName: dbData.fileName,
            fragmentMap: framgnetMapWithSet
        };
        return createdToDoData;
    }

}