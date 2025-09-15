Below is the table for the core channel product \- CPRO50

| Channel Type | Slab Thickness | Bracket Centres | Top Critical Edge Distance 1 | Bottom Critical Edge Distance 2 | Max Tension  (N\_Rd,i) | Max Shear (V\_Rd,i) |
| :---- | :---- | :---- | :---- | :---- | ----- | ----- |
| CPRO50 | 200 | 200 | 75 | 125 | 9.60 | 7.45 |
| CPRO50 | 200 | 250 | 75 | 125 | 11.55 | 8.55 |
| CPRO50 | 200 | 300 | 75 | 125 | 13.35 | 10.35 |
| CPRO50 | 200 | 350 | 75 | 125 | 14.75 | 11.90 |
| CPRO50 | 200 | 400 | 75 | 125 | 14.75 | 13.50 |
| CPRO50 | 200 | 450 | 75 | 125 | 14.75 | 15.00 |
| CPRO50 | 200 | 500 | 75 | 125 | 14.75 | 16.50 |
| CPRO50 | 225 | 200 | 75 | 150 | 9.6 | 8.60 |
| CPRO50 | 225 | 250 | 75 | 150 | 11.55 | 9.70 |
| CPRO50 | 225 | 300 | 75 | 150 | 13.35 | 11.55 |
| CPRO50 | 225 | 350 | 75 | 150 | 14.75 | 13.20 |
| CPRO50 | 225 | 400 | 75 | 150 | 14.75 | 15.00 |
| CPRO50 | 225 | 450 | 75 | 150 | 14.75 | 16.60 |
| CPRO50 | 225 | 500 | 75 | 150 | 14.75 | 16.60 |
| CPRO50 | 250 | 200 | 75 | 175 | 9.6 | 9.90 |
| CPRO50 | 250 | 250 | 75 | 175 | 11.55 | 10.90 |
| CPRO50 | 250 | 300 | 75 | 175 | 13.35 | 12.60 |
| CPRO50 | 250 | 350 | 75 | 175 | 14.75 | 14.60 |
| CPRO50 | 250 | 400 | 75 | 175 | 14.75 | 16.40 |
| CPRO50 | 250 | 450 | 75 | 175 | 14.75 | 16.60 |
| CPRO50 | 250 | 500 | 75 | 175 | 14.75 | 16.60 |

\<shear\_tension\_forces\_by\_channel\_type\_and\_slab\_thickness\>

We are expanding the logic to include more fixing options. We are adding one additional channel, CPRO 50\. From the calculation perspective we want the calculation to perform and find the optimal response for all channel options and the best for each channel family e.g. CRPO 50 and CPRO38. 

**Goals**

1. Integrate CPRO 50 channel, and RawlPlug Products specifications into the optimization engine  
2. Enable automatic optimization across all fixing types to find the best overall solution  
3. Provide channel-family-specific optimization results for comparison  
4. Provide PostFix-family-specific optimization results for comparison  
5. Allow users to constrain optimization to specific channel or Post-Fix families when needed  
6. Present clear comparisons between channel families to support decision-making

1\. Data Structure (/src/types/channelSpecs.ts):  
    \- ChannelSpec interface defines channel properties  
    \- Currently supports single channel type: CPRO38  
    \- Properties include: slab thickness, bracket centers, edge distances, max forces (tension/shear)  
  2\. Channel Data Storage (/src/data/channelSpecs.ts):  
    \- In-memory Map storing channel specifications  
    \- Functions to add/retrieve channel specs  
    \- Currently hardcoded with CPRO38 specifications for various slab thicknesses (200-500mm)  
  3\. Verification Logic (/src/calculations/verificationChecks/fixingCheck.ts):  
    \- Performs channel capacity checks (shear and tension)  
    \- Compares applied forces against channel specifications  
    \- Returns pass/fail status for channel adequacy  
  4\. Optimization Algorithm (/src/calculations/bruteForceAlgorithm/combinationGeneration.ts:79):  
    \- Currently hardcoded to use 'CPRO38' channel type  
    \- Single channel assumed per configuration

  To Add Extra Fixings/Channels, You'll Need to Modify:

  1\. Type definitions \- Extend interfaces to support multiple channels  
  2\. Data storage \- Add specs for additional channel types  
  3\. Calculation logic \- Update force distribution for multiple channels  
  4\. Optimization algorithm \- Include channel quantity/type as optimization variables  
  5\. Form inputs \- Add UI controls for channel selection  
  6\. Results display \- Show multiple channel configurations