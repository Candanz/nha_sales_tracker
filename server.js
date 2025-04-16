export default {
    async fetch(request, env, ctx) {
      if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
      }
  
      try {
        const data = await request.json();
        
        const webhookLicense = env.DISCORD_LICENSE_WEBHOOK;
        const webhookMechanic = env.DISCORD_MECHANIC_WEBHOOK;

        let webhookUrl = webhookLicense;
        let answers = data.answer.answers;
        
        // Example post data 
        // https://webhook.site/#!/view/be3024f6-0f78-4e5d-ab97-9421dde3d5f2/b43aefc8-1f5d-42dc-9b88-0730e88a8a34/1
        // Hardcoded array indices, fuck yeah.
        // I hate how the form sends its data.. oh well

        let saleType = (answers[1].c[0].t == "Pilot's License") ? 0 : 1;
        // Sale types:
        // Pilot's License = 0
        // Mechanic/Extra = 1
        let employee = answers[0].c[0].t;
        let customer = answers[2].fn.f + " " + answers[2].fn.l
        let message = {};

        if (saleType == 0) {
            let firstResponderCertified = answers[3].c[0].t == "Yes"
            let managerDiscount = answers[5].c[0].t == "Yes"
            let paidWithPDTab = answers[4].c[0].t == "Yes"
            message.embeds = [{
                color: 5814783,
                author: {
                    name: 'NHA Sales Tracker - License'
                },
                fields: [
                    {
                        name: 'Employee',
                        value: employee,
                        inline: true
                    },
                    {
                        name: 'Customer',
                        value: customer,
                        inline: true
                    },
                    {
                        name: 'Air-1/Med-flight Certified?',
                        value: firstResponderCertified ? "Yes":"No",
                        inline: false
                    },
                    {
                        name: 'Use PD tab?',
                        value: paidWithPDTab ? "Yes":"No",
                        inline: false
                    },
                    {
                        name: 'Manager Discount? (50% off)',
                        value: managerDiscount ? "Yes":"No",
                        inline: false
                    },
                    {
                        name: 'Total',
                        value: "$ " + ((firstResponderCertified||managerDiscount)?"100.000,00":"200.000,00"),
                        inline: false
                    },
                ]
                }];
        } else {
            webhookUrl = webhookMechanic;
            let embed = {
                author: {
                    name: 'NHA Sales Tracker - Mechanic'
                },
                fields: [
                    {
                        name: 'Employee',
                        value: employee,
                        inline: true
                    },
                    {
                        name: "",
                        value: "",
                        inline: true
                    },
                    {
                        name: 'Customer',
                        value: customer,
                        inline: true
                    }
                ]
            }

            let products = [];
            answers[3].pb.p.forEach(product => {
                products.push({
                    name: (product.v.length == 0) ? product.n : product.n + " - " + product.v[0].n + " " + product.v[0].v,
                    price: product.p,
                    amount: product.a
                })                
            });            

            
            let productString = "";
            let priceString = "";
            products.forEach(product => {
                if(productString != "") productString += "\n"
                if(priceString != "") priceString += "\n"
                productString += product.amount + "x | " + product.name
                priceString += (product.price * product.amount).toLocaleString("en-US", {style:'currency',currency:'USD'})
            });

            embed.fields.push(
                {
                    name: 'Products',
                    value: productString,
                    inline: true
                },
                {
                    name: "",
                    value: "",
                    inline: true
                },
                {
                    name: 'Price',
                    value: priceString,
                    inline: true
                }
            )

            embed.fields.push({
                name: 'Total Price',
                value:  answers[3].pb.t.toLocaleString("en-US", {style:'currency',currency:'USD'})
            })

            message.embeds = [];
            message.embeds.push(embed);
        }

        const payload = message;
  
        const discordResponse = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (!discordResponse.ok) {
          return new Response("Failed to send message to Discord", { status: 500 });
        }
  
        return new Response("Message sent to Discord!", { status: 200 });
      } catch (err) {
        return new Response("Invalid request body", { status: 400 });
      }
    }
  };