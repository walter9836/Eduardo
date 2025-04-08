self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('products')) {
      // Simular una carga completa
      event.respondWith(
        fetch(event.request).then(response => {
          self.clients.matchAll().then(clients => {
            clients.forEach(client => client.postMessage('loading'));
          });
          return response;
        })
      );
    }
  });