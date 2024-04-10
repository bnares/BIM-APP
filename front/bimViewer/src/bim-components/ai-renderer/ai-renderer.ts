
export class AIRenderer{

    settings = {
        prompt: "", // Indications to the AI engine
        negative_prompt: null, // Indications to be avoided by the AI engine
        width: "128", // Maximum 1024
        height: "128", // Maximum 1024
        samples: "1", // Maximum 4
        num_inference_steps: "30",
        safety_checker: "no",
        enhance_prompt: "yes",
        guidance_scale: "10", // cifras en string, min 1, max 20
        strength: 0.7, // Intensity of change, min 0, max 1
        seed: null, // If null, it will be randomly generated
        webhook: null,
        track_id: null,
      };

    async render(image: string){

    }
}