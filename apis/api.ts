import { MapColorData, PageData } from "models/model";

export const getPageData = async (path:String): Promise<PageData> => {
    const apiUrl = `https://newscode-fc5e6-default-rtdb.firebaseio.com/mapanalysis/${path}/.json`;
    const jsonData = await getJsonResponseFromUrl(apiUrl);
    return (jsonData as unknown as PageData);
  };


export async function getJsonResponseFromUrl(url: RequestInfo, maxRetries: number = 3): Promise<Map<string, any>> {
  
  console.log(`collecting data from ${url}`)
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const response: Response = await fetch(url, { cache: 'no-store' });
      const json: Map<string, any> = await response.json();
      if (response.ok) {
        return json;
      }
      throw new Error(`Failed to fetch data. Status: ${response.status}, Message: ${json}`);
    } catch (error) {
      retries++;
      console.error(`Error fetching data (Attempt ${retries}): ${error}`);
    }
  }
  throw new Error(`Max retries (${maxRetries}) reached. Unable to fetch data.`);
}

export async function getColorData(url:RequestInfo){
  const jsonData = await getJsonResponseFromUrl(url);
  return (jsonData as unknown as MapColorData);
}