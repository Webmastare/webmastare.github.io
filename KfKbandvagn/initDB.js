async function initializeDB() {
    try {
        const response = await fetch(`http://localhost:3333/createNewUsersKfKbandvagn`, {method: "GET"});

        if (!response.ok) {
        throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        console.log('API res:',data);
    } catch (error) {
        console.error("There was an error", error)
    }
}