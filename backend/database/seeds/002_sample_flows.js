exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('flows').del();
  
  // Sample flow JSON
  const sampleFlowJson = {
    version: "7.1",
    data_api_version: "3.0",
    screens: [
      {
        id: "WELCOME_SCREEN",
        title: "Welcome",
        data: [
          {
            type: "TextHeading",
            text: "Welcome to our service!"
          },
          {
            type: "TextBody",
            text: "We're excited to help you get started with WhatsApp Flows."
          },
          {
            type: "Footer",
            label: "Get Started",
            on_click_action: {
              name: "navigate",
              next: {
                type: "screen",
                name: "INFO_SCREEN"
              }
            }
          }
        ]
      },
      {
        id: "INFO_SCREEN",
        title: "Information",
        data: [
          {
            type: "TextHeading",
            text: "Tell us about yourself"
          },
          {
            type: "TextInput",
            name: "user_name",
            label: "Your Name",
            required: true
          },
          {
            type: "TextInput",
            name: "user_email",
            label: "Email Address",
            input_type: "email",
            required: true
          },
          {
            type: "Footer",
            label: "Continue",
            on_click_action: {
              name: "complete"
            }
          }
        ]
      }
    ]
  };
  
  // Insert seed entries
  await knex('flows').insert([
    {
      id: '550e8400-e29b-41d4-a716-446655440101',
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Welcome Onboarding Flow',
      description: 'A simple welcome flow for new users',
      flow_json: JSON.stringify(sampleFlowJson),
      status: 'draft',
      version: 1,
      api_version: '7.1',
      categories: ['SIGN_UP'],
      is_public: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440102',
      user_id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Customer Support Flow',
      description: 'Help customers get support quickly',
      flow_json: JSON.stringify({
        version: "7.1",
        data_api_version: "3.0",
        screens: [
          {
            id: "SUPPORT_MENU",
            title: "How can we help?",
            data: [
              {
                type: "TextHeading",
                text: "Customer Support"
              },
              {
                type: "RadioButtonsGroup",
                name: "support_type",
                label: "What do you need help with?",
                data_source: [
                  { id: "billing", title: "Billing Questions" },
                  { id: "technical", title: "Technical Support" },
                  { id: "general", title: "General Inquiry" }
                ],
                required: true
              },
              {
                type: "Footer",
                label: "Submit",
                on_click_action: {
                  name: "complete"
                }
              }
            ]
          }
        ]
      }),
      status: 'draft',
      version: 1,
      api_version: '7.1',
      categories: ['CUSTOMER_SUPPORT'],
      is_public: false,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
};