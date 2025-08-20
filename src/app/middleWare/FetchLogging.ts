export async function FetchLogging<T>(fn : ()=> Promise<T> , name : string) : Promise<T> {
    console.log("Start fetching data for :" , name);

    try {
        const result = await fn();
        console.log("Data fetched successfully for :" , name);
        return result;
    } catch (error) {
        console.error(`[${name}] Lỗi:`, error);
        throw error;
    }
    finally{
         console.log(`[${name}] Kết thúc.`, new Date().toISOString());
    }
}