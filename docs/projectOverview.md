\<objective\>

# The Objective {#the-objective}

The goal of this prompt is to develop a genetic algorithm to determine the optimal dimensions for a masonry support system that will be used on a high-rise building to attach masonry to the building structure.

\<understanding\_masonry\_support\>

## Understanding Masonry Support {#understanding-masonry-support}

The masonry support system is composed of three parts:

1. A cast-in channel which is a steel channel embedded into the concrete slab  
     
2. Multiple brackets which attach to a cast-in channel in the concrete slab that makes up the structure of the building.  
     
3. An angle which extends along the side of the building, embedded into the masonry and attaches to multiple brackets.

The image below shows an example of the system.

![][image1]

The image below gives you a side-on view of the bracket and angle and the notations that will be used through this prompt.

The image is to help you understand the notation and is not to scale or meant to reflect the \<user\_inputs\> or \<system\_inputs\>

![][image2]

The brackets are attached to a cast-in channel attached to a concrete slab in the core building structure at defined intervals \- for example there may be a distance of 500mm between each of the bracket centres along the slab.

The dimensions of the bracket and angle, including the distance between them are governed by a series of calculations in a detailed European regulation document for each manufacturer’s products that determine whether a specific system will work or not based on the provided inputs.

In this image below we can see that the brick support level (BSL) (the horizontal leg of the angle in purple) is below the bottom of the slab.  We therefore know that the effective rise to bolts will be less than the actual distance from the bottom of the bracket to the bolt.  
![][image3]

\<understanding\_the\_slab\_and\_channel\>

### Understanding the slab and channel {#understanding-the-slab-and-channel}

* The concrete slab is part of the core building structure into which a cast-in channel is embedded  
  * The dimensions of the slab and the relative location of the cast-in channel are defined in the \<shear\_tension\_forces\_by\_channel\_type\_and\_slab\_thickness\> table  
  * For example, a slab with 200mm Slab thickness has a top critical edge distance of 75mm and a bottom critical edge distance of 125, meaning the bracket fixing sits 75mm from the top of the slab.  
  * The bottom critical edge distance defines the maximum possible rise to bolts as this is the amount of bracket that is bearing on the slab  
  * The SSL is the Structural Slab Level and defines the top of the concrete slab  
  * The BSL is the Brick Support Level and defines the level at which the angle supports the masonry.

\<understanding\_the\_bracket\>

### Understanding the bracket {#understanding-the-bracket}

![][image4]

* The bracket is a single piece of steel:  
  * Cut from a rectangular piece of steel  
  * Bent into a U shape consisting of a thin central spine and two wings that reach from the slab to the masonry  
  * To account for the bend, a bracket width of 56mm we count the width of the spine as \- 43.17mm for 3mm bracket thickness and 40.55mm for 4mm bracket thickness  
  * The bracket has a rectangular slot in the spine which allows the fixing to connect it to the cast in channel.  The hole is 30mm in height, and whilst the fixing is designed to be in the centre of this, the rise to bolt calculations must account for the worst possible placement so we always reduce 15mm from the central point for our verification checks.  
  * To calculate the steel volume of a bracket we can use (bracket projection\*2 \+ (43.17mm or 40.55mm) \*(bracket height)\*thickness

## Notches

In some scenarios a notch may be put into the back of the bracket to avoid the bracket conflicting with other items in the building.

A notch is defined by:

* Notch height (how high the notch comes up from the bottom of the bracket (or from the top in an inverted bracket)  
* Notch length (how deep the notch is into the width of the bracket, measured from the back of the bracket)

IMPORTANT: When a notch is used, the Rise to Bolts calculation must be reduced accordingly by the height of the notch, as Rise To Bolts describes the amount of the bracket that is in contact with the slab, and the notch reduces this.

### Inverted brackets

When the fixing is above BSL we use a standard bracket  
When the fixing is below BSL we use an inverted bracket

We can calculate the fixing as being \-75mm below the SSL as per the Top Critical Edge Distance table in \<shear\_tension\_forces\_by\_channel\_type\_and\_slab\_thickness\>

![][image5]  
![][image6]

\</understanding\_the\_bracket\>

\<understanding\_the\_angle\>

### Understanding the angle {#understanding-the-angle}

* The angle is a single piece of steel:  
  * Cut from a single piece of steel  
  * Bent into a 90 degree right angle, with a vertical leg and horizontal leg  
  * The vertical leg attaches to the bracket via a fixing  
  * The horizontal leg sits within the masonry wall to provide tension and shear support  
  * The bottom level of the horizontal leg is dependent on the angle thickness and vertical leg.  
    * For a 5mm and 6mm angle thickness the vertical leg is 60mm and the bottom of the horizontal leg of the angle is flush to the bottom edge of the bracket  
    * For an 8mm angle thickness the vertical leg is 75mm and the bottom of the horizontal leg of the angle is not 15mm below the bottom edge of the bracket  
  * Multiple brackets are attached along the length of the angle according to the approved design

\<standard\_and\_inverted\_angles\>

The angle can be positioned in two ways:

Standard \- the vertical leg is above the horizontal leg

![][image7]  
Inverted \- the vertical leg is below the horizontal leg  
![][image8]

\</standard\_and\_inverted\_angles\>

The use of a standard or inverted angle can be used to provide additional options by extending or reducing the height of the bracket and rise to bolts in order to reach to BSL.

* **Standard bracket** \- using an inverted angle requires adding the height of the vertical leg to the bracket\_height.  
    
* **Inverted bracket** \- using an standard angle requires adding the height of the vertical leg to the bracket height

As per the table in \<selecting\_inverted\_brackets\_and\_angles\> for some scenarios we want to try the angle in both formats, as we may uncover a more optimal design by reaching the BSL with an alternative approach.

\</understanding\_the\_angle\>

\<selecting\_inverted\_brackets\_and\_angles\>

Bracket and Angle Selection Table

| Support Level Examples | Fixing Height (from SSL) | Distance between | Bracket | Angle | Toe plate |
| :---- | :---- | :---- | :---- | :---- | :---- |
| \+50mm | \-75mm | 125mm | Inverted | Try both | Match angle |
| \+25mm | \-75mm | 100mm | Inverted | Try both | Match angle |
| 0 | \-75mm | 75mm | Inverted | Try both | Match angle |
| \-25mm | \-75mm | 50mm | Inverted | Standard | Match angle |
| \-50mm | \-75mm | 25mm | Inverted | Standard | Match angle |
| \<=-75mm | \-75mm | 0mm | Standard | Inverted | Match angle |
| \-100mm | \-75mm | 25mm | Standard | Inverted | Match angle |
| \-125mm | \-75mm | 50mm | Standard | Inverted | Match angle |
| \-135mm | \-75mm | 60mm | Standard | Inverted | Match angle |
| \-150mm | \-75mm | 75mm | Standard | Try both | Match angle |
| \-175mm | \-75mm | 100mm | Standard | Try both | Match angle |

\</selecting\_inverted\_brackets\_and\_angles\>

\<understanding\_the\_angle\_bracket\_positioning\>

A critical part of the overall system design is calculating the positioning of one or more brackets on a length of angle.

\<standard\_run\>

A standard run is one where there is no restriction from the building design in terms of the length of the angle used.

* The maximum length of angle that can be manufactured, regardless of its thickness, is 1490mm.  This is because sheets are 1.5mx3.0m and always should be bent in the 1.5m direction.  
* Typically the length of angle is 10mm less than “supported width, so for example 500mm B\_cc with 3 brackets is supporting 1.5m, but the angle length will be 1490mm, this allows for a 10mm gap between this angle and the next placed angle (10mm is standard in masonry detailing).  
* Angle lengths are limited to 5mm increments eg 750mm, 755mm, 800mm.  
* The objective is to maximise the spacing between brackets.  For example, if 450mm B\_cc is the optimal design, then its better we consider the longest length as 1340mm instead of 1490mm

This table provides examples of the longest angle lengths by the gap in bracket centres (B\_cc)

In these examples, we would place the first bracket at a distance of half the B\_cc spacing minus 5mm.  So for a 500mm B\_cc on a 1490mm angle, the first bracket would be 245mm from the first end of the angle, then 500mm each bracket from there, and then the last one another 500mm, making it 245mm from the other end.

| c/c | Longest length | Next longest length | Next longest length | Next longest length | Next longest length | Next longest length | Next longest length |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 500 | 1490 | 990 | 490 | \- | \- | \- | \- |
| 450 | 1340 | 890 | 440 | \- | \- | \- | \- |
| 400 | 1190 | 790 | 390 | \- | \- | \- | \- |
| 350 | 1390 | 1040 | 690 | 340 | \- | \- | \- |
| 300 | 1490 | 1190 | 890 | 590 | 290 | \- | \- |
| 250 | 1490 | 1240 | 990 | 740 | 490 | 240 | \- |
| 200 | 1390 | 1190 | 990 | 790 | 590 | 390 | 190 |

The calculations above assume we have long straight runs and can use the maximum possible angle length.

\<standard\_run\>

\<non-standard\_runs\>

A non-standard run refers to scenarios where the design is getting close to a corner or something protruding and we need to measure the length of the angle we require and fit the design to that length.

The B\_cc that is calculated in the optimised design is the maximum width that the bracket can support, and therefore we can select a smaller distance to suit our required design.

We calculated this as the length of angle available, divided by the B\_cc and then rounded up to the next whole number of brackets.

Examples:  
750mm angle and 500mm B\_cc \= 1.5 therefore two brackets  
1100mm angle and 500mm B\_cc \= 2.2 therefore three brackets

Positioning of brackets.  

If there is an odd number of brackets, on bracket is placed in the centre of the angle, and then the remaining brackets are positioned according to the B\_cc or less to fit them on the angle.

Brackets can only be placed at 50mm increments so we may need to round the distances up to accommodate the spacing.

If we require a 750mm piece of angle (already taking into account the required 10mm gap between angles) with 500mm B\_cc this will need two brackets, (750/

these then should be placed evenly on that angle, observing the spacing between them, and then half spacing on either side.

![][image9]

1. Calculate how many brackets to place on the angle  
2. Where to position them  
   1. if an odd number of brackets place one bracket in the centre of the angle and then space the others outwards towards each edge by their B\_cc  
   2. If an even number of brackets \- use the formula  
3. Align to bracket fixing positions  
   1. Bracket slots are aligned to the central point of the angle, and then incremental 50mm slots to the left and right  
   2. Brackets can only be placed every 50mm, so if required the design should reduce the B\_cc from the optimum design suggested.

\<non\_standard\_example\>

As an example:

* 750mm angle  
* 500mm B\_cc from the optimized design  
* Two brackets  
* 2X \= 750mm  
* X \= 375mm  
* 0.5X \= 187.5mm  
* But brackets can only be placed every 50mm so place them 400mm apart from the centre of the angle leaving 175mm on each side

\</non\_standard\_example\>

\</non-standard\_runs\>

\</understanding\_the\_angle\_bracket\_positioning\>

\</understanding\_masonry\_support\>

Having developed the algorithm, this will be used in a future deterministic software application that will be used by structural engineers in their masonry design projects.

This is a serious task with big consequences if the answers are incorrect.  You should follow the formulas and instructions exactly, and if you are unsure or have questions then you should ask for clarification.

\</objective\>

# Inputs {#inputs}

\<user\_inputs\>

## User Inputs {#user-inputs}

These are the sample inputs that would come from the user.

We will use these for the development of our script.

| Question | Notation | Description | User Input |
| :---- | :---- | :---- | :---- |
| What is your slab thickness? | Slab\_thickness | This is the height of the concrete slab the system is attaching to | 225mm |
| What is the cavity? | C | This is the distance between the edge of the concrete slab and the masonry \- denoted by C | 200mm |
| What is the support level? | Support\_level | This denotes the distance from the top of the slab known as the Structural Slab Level SSL (considered as zero) to the Brick Support Level (BSL) where the horizontal leg of the angle provides support to the masonry .  This can be negative if the support is below the SSL and positive if BSL is above the SSL. | \-200mm |
| Do you know what the characteristic load is? | C\_udl | This Characteristic Uniformly Distributed Load (UDL) at the Serviceability Limit State (SLS) | 14 kN/m |
| If you require a notch, what height is required? | H\_Notch | A notch is sometimes required if the bracket extends beyond the bottom of the slab. This allows space for the bracket to avoid any other items in the cavity. A notch is a cutout section from the back of the bracket and reduces the effective bracket height by reducing the amount of bracket in contact with the slab | 0mm |

If the user does not know the characteristic load, then the following numbers will be requested to calculate it using the \<loading\_calculations\> tag.

| M\_d | Masonry density (kg/m3) | Default | 2000 |
| :---- | :---- | :---- | :---- |
| M | Masonry thickness (mm) | Default | 102.5 |
| M\_h | Masonry height (m) | User defined | 1-10m |

\</user\_inputs\>

\<system\_inputs\>

## System Inputs {#system-inputs}

These are the notations of system values that are then used in the verification calculations further in the process.

Some of these values are default set values (such as gravity), some are calculated values and some will be generated by the genetic algorithms part of the initial population creation process.

| Notation | Description | Genetic algorithm, default or calculated? | Min/Max and increments |
| :---- | :---- | :---- | :---- |
| **Bracket** |  |  |  |
| B\_cc | Supported width per bracket.  This is the distance between the bracket centres.  | Genetic Algorithm | Must not exceed 600mm. 500mm max for loads over 5kN Increments of 50mm only |
| L | Bracket height (mm) | Calculated | Is calculated as the Support\_level expressed as a positive (ie 225mm) minus the top critical edge distance (ie 75mm) plus distance from top of bracket to fixing (Y) (fixed at 40mm) \= ie bracket height 190mm 100-490mm possible range in 5mm increments.  |
| D | Bracket projection (mm) | Calculated | Driven by the cavity, C-10 rounded down to nearest 5mm 50-340mm range in 5mm increments |
| S | Isolation shims thickness (mm) | Default | 3m or 5mm set to 3 but could be changed to 5 later by the user |
| t | Bracket thickness (mm) | Genetic Algorithm | 3mm default, if shear load per bracket \>4kN must increase bracket thickness to 4mm. If shear load per bracket \> 10kN must be reviewed by engineer |
| X | Rise to bolts (mm) | Calculated | Is calculated bracket height minus 55mm (distance from top of bracket to fixing (Y) which is 40mm \+ 15mm to account for the worst possible bracket fixing position giving a total of 55mm) If the support level is greater than the slab thickness minus the top critical edge then this means the bracket is projecting below the bottom of the slab.  In this scenario Rise to bolts (X)  is limited to the bottom critical edge distance for the slab thickness according to the table in \<shear\_tension\_forces\_by\_channel\_type\_and\_slab\_thickness\> |
| Y | Distance from top of bracket to fixing (mm) | Default | Default is 40mm.  When used in verification checks we add 15m to account for the 30mm height of the slot in the bracket to ensure we calculate the worst case scenrio |
| **Angle** |  |  |  |
| B | Horizontal leg (mm) | Default | 90mm standard, but user could change, range 85-105mm |
| A | Vertical leg (mm) | Genetic algorithm | 60mm for 5mm and 6mm angle 75mm for 8mm angle but user could change |
| T | Angle thickness (mm) | Genetic algorithm | Based on steel sheet sizes, 3, 4, 5, 6, 8,10, 12, default 5mm |
| l | Angle span (mm) | Calculated | Equal to Bracket supported width (B\_cc) which is being defined by the Genetic Algorithm and must match that for each design |
| np | Number of plates per channel | Default | Set at 2 |
| P | Drop below the slab (mm) | Calculated | Is calculated bracket height (L) minus slab thickness minus top critical edge distance plus distance from top of bracket to fixing (Y) May be zero if bracket does not project below slab |
| C\_grade | Concrete grade (compressive strength) | Default | Default value 30 |
| **Other** |  |  |  |
| L\_f  | Load Factor | Default | 1.35 |
| t\_p | Packing shimming thickness (mm) | Default | 0-15, default 10mm |
| d\_p | Bolt diameter (mm) | Default | M10 (10mm) or M12 (12mm), standard M10 is 10mm.  M12 would only be used if no workable solution could be found for M10 bolts |
| B\_proj | Bracket projection (at fixing) | Calculated | is only for cases when there is a drop below the slab (P\>0), it considers the correct projection for the component of the bracket that is put into bending as a result of its drop. We calculate the distance to the edge of the bracket at the height of the fixing into the cats-in channel for use in the 1.6 verification checks. |
| Def\_included | Should additional deflection due to span be included? | Default | Yes |
| g | Gravity (m/s2) | Default | Set value of 9.81 |

\<system\_inputs\>

\</inputs\>

\<shear\_tension\_forces\_by\_channel\_type\_and\_slab\_thickness\>

# Shear and Tension Forces Table {#shear-and-tension-forces-table}

The algorithm will need to interrogate this table as part of its process \- for each channel type, the european regulation sets a maximum tension and maximum shear load depending on the distance between the bracket centres.

Therefore, as the system changes, different maximum tension and shear values will need to be evaluated.

Below is the table for the core channel product \- CPRO38

**Concrete: (C30/37)**

1. Top Critical Edge Distance 1 \- the distance from the top of the slab (SSL) to the centre of the fixing  
2. Bottom Critical Edge Distance 2 \- the distance from the centre of the fixing down to the bottom of the slab  
3. The Bottom Critical Edge Distance also therefore defines the maximum effective rise to bolt, as it describes the amount of the bracket that is bearing on the slab, even if the bracket itself is larger.

| Channel Type | Slab Thickness | Bracket Centres | Top Critical Edge Distance 1 | Bottom Critical Edge Distance 2 | Max Tension  (N\_Rd,i) | Max Shear (V\_Rd,i) |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| CPRO38 | 200 | 200 | 75 | 125 | 7.75 | 7.45 |
| CPRO38 | 200 | 250 | 75 | 125 | 9.45 | 8.55 |
| CPRO38 | 200 | 300 | 75 | 125 | 10.75 | 10.35 |
| CPRO38 | 200 | 350 | 75 | 125 | 13 | 11.90 |
| CPRO38 | 200 | 400 | 75 | 125 | 13.5 | 13.5 |
| CPRO38 | 200 | 450 | 75 | 125 | 13.9 | 15 |
| CPRO38 | 200 | 500 | 75 | 125 | 14.25 | 16.5 |
| CPRO38 | 225 | 200 | 75 | 150 | 7.75 | 8.60 |
| CPRO38 | 225 | 250 | 75 | 150 | 9.45 | 9.7 |
| CPRO38 | 225 | 300 | 75 | 150 | 10.75 | 11.55 |
| CPRO38 | 225 | 350 | 75 | 150 | 13 | 13.2 |
| CPRO38 | 225 | 400 | 75 | 150 | 13.5 | 15 |
| CPRO38 | 225 | 450 | 75 | 150 | 13.9 | 16.6 |
| CPRO38 | 225 | 500 | 75 | 150 | 14.25 | 16.6 |
| CPRO38 | 250 | 200 | 75 | 175 | 7.75 | 9.9 |
| CPRO38 | 250 | 250 | 75 | 175 | 9.45 | 10.9 |
| CPRO38 | 250 | 300 | 75 | 175 | 10.75 | 12.6 |
| CPRO38 | 250 | 350 | 75 | 175 | 13 | 14.6 |
| CPRO38 | 250 | 400 | 75 | 175 | 13.5 | 16.4 |
| CPRO38 | 250 | 450 | 75 | 175 | 13.9 | 16.6 |
| CPRO38 | 250 | 500 | 75 | 175 | 14.25 | 16.6 |

\<shear\_tension\_forces\_by\_channel\_type\_and\_slab\_thickness\>

\<weight\_of\_steel\>

# Weight of steel {#weight-of-steel}

We use these calculations to estimate the weight of steel in the system

\<bracket\_weight\>

(Bracket projection D\*2) \+ (43.17 for 3mm bracket or 40.17 for 5mm bracket)  \*(Bracket Height L)\*(Bracket thickness t)=bracketVolume

Calculate brackets per meter

B\_cc/1000=bracketsPerMeter

\</bracket\_weight\>

\<angle\_weight\>

(Angle horizontal leg \+ angle vertical leg \- angle thickness) \* 1000 \* 0.001 \= angleVolume

\</angle\_weight\>  
\<system\_weight\>

angleVolume \+ bracketVolume \* bracketsPerMeter \= totalVolume

\</system\_weight\>

\<combined\_weight\>

totalVolume \* 7.85 / 1000; // kg/m

\</weight\_of\_steel\>



\<brute\_force\_algorithm\_explanation\>

## Brute Force Algorithm

As an alternative to the genetic algorithm, a brute-force approach can be employed to find the optimal masonry support system. This method guarantees finding the absolute best design according to the defined criteria, provided one exists within the parameter space, as it exhaustively evaluates every possible combination.

The brute-force algorithm operates as follows:

1. **Combination Generation**:  
     
   * The algorithm first defines a set of possible values for each core design parameter:  
     * Bracket Centres (`B_cc`): e.g., \[200, 250, ..., 600mm\]  
     * Bracket Thickness (`t`): e.g., \[3mm, 4mm\]  
     * Angle Thickness (`T`): e.g., \[3mm, 4mm, 5mm, 6mm, 8mm\]  
     * Bolt Diameter (`d_p`): e.g., \[M10, M12\]  
   * It then generates every single unique combination of these parameters.  
   * Constraints are applied during generation, for example:  
     * The `vertical_leg` (A) of the angle is determined by the `angle_thickness` (T) (60mm for T \< 8mm, 75mm for T \= 8mm).  
     * `bracket_centres` are limited based on the `characteristic_load` (e.g., max 500mm if load \> 5kN/m).  
     * Fixed parameters like `horizontal_leg` (B) and `channel_type` are typically set to default values (e.g., 90mm and CPRO38 respectively).

   

2. **Evaluation of Each Combination**:  
     
   * For every generated combination, the algorithm performs a full evaluation:  
     * **Calculate Dependent Parameters**: System parameters that depend on the chosen combination (like `bracket_height` (L), `rise_to_bolts` (X), etc.) are calculated based on user inputs and the current parameter set.  
     * **Engineering Calculations**: A series of calculations are performed:  
       * Loading Calculations (`calculateLoading`)  
       * Bracket Calculations (`calculateBracketParameters`)  
       * Angle Calculations (`calculateAngleParameters`)  
       * Mathematical Model Calculations (`calculateMathematicalModel`)  
     * **Verification Checks**: The design undergoes all engineering verification checks (`verifyAll`) as detailed in the subsequent sections (Moment Resistance, Shear Resistance, Angle Deflection, etc.). This step determines if the design is structurally sound and meets all safety criteria.  
     * **Steel Weight Calculation**: If the design passes all verification checks (is deemed "valid"), its total steel weight (`calculateSystemWeight`) is computed.

   

3. **Optimal Design Selection**:  
     
   * The algorithm iterates through all combinations.  
   * It keeps track of the valid design that has the minimum total steel weight encountered so far.  
   * If a combination fails any verification check, it is considered invalid and typically assigned an infinitely high weight or simply discarded.
   * If the level of the support angle is above the bottom of the slab, the system should optimise for the standard angle solution where the bracket does not project below the slab, even if an inverted angle solution is available.. 
   * If the only viable solution available is with an inverted angle requiring the bracket projects below the slab the system should also create an alert for the user to state a notch may be required if the full bearing of the slab (max rise to bolt) is utilised.


   

4. **Result**:  
     
   * After evaluating all possible combinations, the algorithm returns the valid design, optimised for a standard angle to not drop the bracket below the slab, with the absolute lowest steel weight.  
   * If no combination passes all verification checks, it indicates that no valid design exists within the specified parameter ranges and constraints.

This systematic approach ensures that if a valid and optimal solution exists within the explored parameter space, the brute-force algorithm will find it. The main trade-off is computational cost, as the number of combinations can grow very large with an increasing number of parameters or possible values for each parameter.

\</brute\_force\_algorithm\_explanation\>

\<genetic\_algorithm\_instructions\>

# Genetic Algorithm instructions {#genetic-algorithm-instructions}

You have been provided with some example user inputs in the \<user\_inputs\> tag and system defaults from the \<system\_inputs\> tag.

Using these inputs you should develop a genetic algorithm that follows this process:

1. Generate 50 initial designs  
2. For each generation (up to 100\)  
   1. Calculate fitness scores  
   2. Select parents via tournament selection  
   3. Perform crossover and mutation to create 50 new designs  
   4. Validate and recalculate dependent parameters  
   5. Check for convergence (no improvement in max fitness for 20 generations)  
3. Return the design with the highest fitness score.

The objective of this genetic algorithm is to minimise the weight of steel per meter, whilst delivering a workable system.  The weight of steel is a heuristic for the cost of the system \- hence less weight means less cost.

The weight of the steel can be optimised through two main components:

1. Maximise the bracket centre distance (i.e, the furthest distance between each bracket without the system failing)  
2. Minimise the angle thickness (ie the most amount of support at the smallest amount of steel in the angle)

There is a trade off between these two components \- a greater angle thickness will increase the available bracket centre distance and vice versa.

Our goal is to find the most optimal trade off that passes all the tests.

\<initial\_population\_generation\>

## Initial population generation {#initial-population-generation}

The initial population consists of **50 possible designs**, each following a set of general rules. 

Parameters are either **calculated** (based on user inputs and dependencies like angle thickness) or **randomly selected** within specified ranges and constraints. Here’s how each parameter is determined:

#### **Calculated Parameters (Dependent on User Inputs and Angle Thickness)**

* **Bracket Height (L):**  
  * Calculated as:  
    L=support\_level−top critical edge distance+Y where Y=40 mm (fixed distance from top of bracket to fixing).  
    * For angle thickness T=3,4,5,6 mm: Use the formula directly.  
       *Example:* If support\_level \= 225 mm and top critical edge distance \= 75 mm, then L=225−75+40=190 mm.  
    * For T=8 mm: Adjust by subtracting 15 mm to account for the drop below the bracket:  
       L=(support\_level−top critical edge distance+Y)−15 mm  
       *Example:* For the same inputs, L=190−15=175 mm.  
  * **Note:** While the base formula (without the T=8 mm adjustment) yields the same L L for a given support height and top critical edge distance, the final L varies across designs depending on the randomly selected angle thickness T.  
* **Rise to Bolts (X):**  
  * Calculated as:  
     X=L−Y  
  * *Example:* For L=190 mm, X=190−40=150 mm; for L=175 mm, X=175−40=135 mm  
  * **Adjustment:** If the support level (i.e., the bottom of the bracket) projects below the slab (when support\_level \> slab\_thickness \- top critical edge distance), X is limited to the **bottom critical edge distance** specified in the table \<shear\_tension\_forces\_by\_channel\_type\_and\_slab\_thickness\> for the given slab\_thickness.  
  * **Note:** X varies across designs because it depends on L, which is influenced by T.  
* **Bracket Projection (D):**  
  * Calculated as:  
     D=cavity width (C)−10 mm, rounded down to the nearest 5 mm.  
    * *Example:* If cavity width \= 87 mm, D=87−10=77 mm, rounded down to 75 mm.  
  * **Note:** This is a fixed value across all designs in the initial population, as it depends solely on the user-provided cavity width.  
* **Vertical Leg (A):**  
  * Determined by the selected angle thickness T:  
    * A=60 mm if T=3,4,5,6 mm   
    * A=75 mm if T=8 mm   
  * **Note:** This is a calculated value linked to T, so it varies across designs based on the randomly chosen angle thickness.  
* **Horizontal Leg (B):**  
  * Fixed at: B=90 mm  
  * **Note:** This is a default value, so all designs in the initial population use 90 mm.  
* **Channel Type:**  
  * Fixed as: **CPRO38**  
  * **Note:** This is a default value, so all designs in the initial population use CPRO38.

  #### **Variable Parameters (Randomly Selected for Each Design)**

* **Angle Thickness (T):**  
  * Options: 3,4,5,6,8 mm   
  * Selection: Randomly chosen with **uniform probability** (no bias) to ensure broad exploration of the design space.  
  * **Impact:** Influences L, X, and A as described above.  
* **Bracket Thickness (t):**  
  * Options: 3 mm,4 mm  
  * Probability depends on C\_udl (characteristic uniformly distributed load):  
    * If C\_udl≤8 kN/m: 80% chance of 3 mm, 20% chance of 4 mm  
    * If C\_udl\>8 kN/m: 20% chance of 3 mm, 80% chance of 4 mm  
  * Selection: Randomly assigned for each design based on these probabilities.  
* **Bolt Diameter (d\_p):**  
  * Options: M10,M12  
  * Probability: 95% M10, 5% M12 across the initial population.  
  * Selection: Randomly assigned for each design based on these probabilities.  
* **Bracket Centers (B\_cc):**  
  * Range: 200 mm to 600 mm in 50 mm increments (200, 250, 300, ..., 600\)  
  * Constraints:  
    * Maximum 500 mm if C\_udl\>5 kN/m   
    * Maximum 600 mm if C\_udl≤5 kN/m   
  * Selection: Randomly chosen with **uniform distribution** within the allowed range for each design.

  #### **Implementation Steps**

For each of the 50 designs in the initial population:

1. **Select Variable Parameters:**  
   * Randomly select T from \[3,4,5,6,8\] mm with equal probability.  
   * Randomly select t (3 mm or 4 mm) based on C\_udl probabilities.  
   * Randomly select bolt diameter (95% M10, 5% M12).  
   * Randomly select B\_cc from the allowed range (200–600 mm or 200–500 mm, depending on C\_udl in 50 mm increments.  
2. **Calculate Dependent Parameters:**  
   * Based on the selected T:  
     * Set A: 60 mm if T=3,4,5,6 mm; 75 mm if T=8 mm   
     * Calculate L:  
       * If T=3,4,5,6 mm: L=support\_level−top critical edge distance+40   
       * If T=8 mm: L=(support\_level−top critical edge distance+40)−15  
     * Calculate X=L−40.  
     * If the bracket projects below the slab (support\_level \> slab\_thickness \- top critical edge distance), adjust X to not exceed the bottom critical edge distance from the table \<shear\_tension\_forces\_by\_channel\_type\_and\_slab\_thickness\>.  
   * Calculate D=cavity width−10 mm, rounded down to the nearest 5 mm.  
3. **Set Fixed Parameters:**  
   * B=90 mm  
   * Channel type \= CPRO38

For each design provide:

* Bracket centres (B\_cc)  
* Bracket height (L)  
* Rise to bolts (X)  
* Bracket thickness (t)  
* Bracket projection  (D)  
* Bolt diameter (d\_p)  
* Angle thickness (T)  
* Vertical leg (A)  
* Horizontal leg (B)  
* Channel type

\</initial\_population\_generation\>

\<fitness\_scoring\>

## Fitness scoring {#fitness-scoring}

For each design, the algorithm will then calculate and checks:

1. **Steel weight** \- how heavy the design is (lighter is better)  
2. **Engineering rules** \- additional practical constraints:  
   - Maximum bracket load (4kN for 3mm brackets, 10kN for 4mm brackets)  
   - System deflection limit (not exceeding 1.5mm)  
   - Bolt size preference (M10 preferred over M12)  
   - Bracket centers limit (max 500mm spacing for loads over 5kN/m, 600mm for others)  
3. **Verification checks** \- a series of engineering tests to ensure the design is structurally sound:  
   - Moment resistance  
   - Shear resistance  
   - Angle deflection  
   - Angle to bracket connection  
   - Shear reduction due to packers  
   - Bracket design  
   - Fixing check  
   - Combined tension-shear check

Each design receives a "fitness score" based on how well it performs. Designs that pass all checks and use less material receive better scores. Additionally:

1. Base score: Inverse of steel weight (e.g., score \=k/weight where k is a constant)  
2. Penalties  
   1. Designs using more steel receive a proportional penalty  
      1. Penalty \= (weight \- min\_weight) / min\_weight \* penalty\_factor  
      2. Where:  
      3. weight \= steel weight of the current design,  
      4. min\_weight \= steel weight of the lightest design in the population,  
      5. penalty\_factor \= 0.1 (e.g., 10% penalty per unit of relative weight increase).  
      6. Example: If lightest design \= 10 kg/m and current design \= 12 kg/m:  
      7. Penalty \= (12 \- 10\) / 10 \* 0.1 \= 0.02 (2% reduction in score).  
   2. Designs that fail one or more verification checks are penalised cumulative 10% per failure (eg 2 failures \= 20% failure)  
3. Bonus  
   1. Designs using M10 bolts receive a 5% fitness bonus

\</fitness\_scoring\>

\<selection\_and\_breeding\>

## Selection and breeding {#selection-and-breeding}

The algorithm then uses an evolutionary approach:

**Selection**

* Use **tournament selection**:  
  * Randomly select a subset of 5 designs from the population.  
  * Choose the design with the highest fitness score from this subset as a parent.  
  * Repeat to select a second parent.  
* This balances exploration and exploitation of high-fitness designs.  
  **Crossover**

Crossover combines traits from two parent designs by swapping variable parameters (genes) and recalculating dependent parameters to ensure consistency 

**Genes and Parameters**

* **Genes Representing Each Design**:  
  * \[B\_cc, T, t, d\_p\] (4 genes, where B\_cc is the center-to-center spacing, T is the angle thickness, t is the bracket thickness, and d\_p is the bolt diameter).  
* **Calculated Parameters (Dependent on T)**:  
  * Vertical leg (A), bracket height (L), and rise to bolts (X) are recalculated for each offspring based on the inherited T and fixed user inputs (e.g., support\_level, slab\_thickness).  
* **Fixed Parameters**:  
  * Bracket projection (D), horizontal leg (B), and channel type remain constant across all designs and are not part of the crossover process.

  #### **Crossover Process**

1. **Perform Single-Point Crossover**:  
   * Randomly select a crossover point within the gene sequence \[B\_cc, T, t, d\_p\].  
   * Swap the genes after this point between the two parent designs to create two offspring.  
   * **Example**:  
     * Parent 1: \[300, 5, 3, M10\]  
     * Parent 2: \[400, 6, 4, M12\]  
     * Crossover point after the 2nd gene (T):  
       * Child 1: \[300, 5, 4, M12\] (inherits T=5 from Parent 1\)  
       * Child 2: \[400, 6, 3, M10\] (inherits T=6 from Parent 2\)  
2. **Recalculate Dependent Parameters for Each Offspring**:  
   * Using the inherited T, update A, L, and X according to the following rules:  
     * **If T \= 3, 4, 5, or 6 mm**:  
       * A \= 60 mm  
       * L \= support\_level (where support\_level is the desired distance from Structural Slab Level (SSL) to Brick Support Level (BSL), e.g., 200 mm)  
       * X \= L \- Y (where Y is the distance from the top of the bracket to the fixing, e.g., 40 mm)  
     * **If T \= 8 mm**:  
       * A \= 75 mm  
       * L \= H \- 15 mm (accounting for a 15 mm drop below the bracket)  
       * X \= L \- Y  
   * **Example (continued)**:  
     * For Child 1 (T=5):  
       * A \= 60 mm  
       * L \= 200 mm (assuming support height=200 mm)  
       * X \= 200 \- 40 \= 160 mm  
     * For Child 2 (T=6):  
       * A \= 60 mm  
       * L \= 200 mm  
       * X \= 200 \- 40 \= 160 mm  
     * *(Note: If Child 2 had T=8, then A=75 mm, L=185 mm, X=145 mm.)*  
3. **Ensure Constraints**:  
   * Check that B\_cc adheres to load-based maxima:  
     * 500 mm if load \> 5 kN/m  
     * 600 mm otherwise  
   * If the bracket projects below the slab, ensure X does not exceed the bottom critical edge distance (refer to the shear/tension forces table by channel type and slab thickness).  
4. **Store Updated Parameters**:  
   * Save the recalculated A, L, and X as attributes of each offspring design for use in fitness evaluation.

   #### **Result**

* The offspring inherit a mix of variable parameters from their parents while maintaining structural consistency through recalculated A, L, and X values based on the new T.  
* This process preserves diversity in B\_cc, T, t, and bolt diameter while ensuring the design adapts to the inherited angle thickness.  
  **Mutation**  
* Apply mutations to individual variable genes with a small probability (e.g., 5% per gene) to generate a new set of 50 potential designs  
* These are the two main factors that engineers use to optimise the system  
  * **Bracket Centers (B\_cc)**: Add or subtract 50mm (e.g., 300mm → 250mm or 350mm), respecting load-based maxima (500mm or 600mm).  
  * **Angle Thickness (T)**: Move to a neighboring thickness (e.g., 4mm → 3mm or 5mm), staying within \[3, 4, 5, 6, 8\].  
  * Update A after mutation (eg if T changes from 6mm to 8mm, A changes from 60mm to 75mm  
  * **Update Dependent Parameters**: After mutating T, recalculate:  
    * **Vertical Leg (A)**:  
      * Set A \= 60 mm if T \= 3, 4, 5, or 6 mm.  
      * Set A \= 75 mm if T \= 8 mm (e.g., if T changes from 6 mm to 8 mm, A updates from 60 mm to 75 mm).  
    * **Bracket Height (L)**:  
      * L=support\_level−top critical edge distance+Y where Y=40 mm (fixed distance from top of bracket to fixing).  
        * For angle thickness T=3,4,5,6 mm: Use the formula directly.  
           *Example:* If support\_level \= 225 mm and top critical edge distance \= 75 mm, then L=225−75+40=190 mm.  
        * For T=8 mm: Adjust by subtracting 15 mm to account for the drop below the bracket:  
           L=(support\_level−top critical edge distance+Y)−15 mm  
           *Example:* For the same inputs, L=190−15=175 mm.  
    * **Rise to Bolts (X)**:  
      * Set X \= L \- Y, where Y is the distance from the top of the bracket to the fixing (e.g., 40 mm).  
* The following factors can be optimised, but they provide tiny improvements compared to the Bracket Centres (B\_cc) and Angle Thickness (T)  
  * **Bracket Thickness (t)**: Toggle between 3mm and 4mm (e.g., 3mm → 4mm).  
  * **Bolt Diameter**:  
    * 80% chance to switch to M10 (if M12).  
    * 20% chance to switch to M12 (if M10).  
* After mutation, re-validate constraints:  
  * B*\_cc is in \[200, max\_*allowed\] and a multiple of 50mm  
  * t is 3 mm or 4 mm  
  * Bolt diameter is M10 or M12  
  * A matches T (60 mm for T \= 3, 4, 5, 6 mm; 75 mm for T \= 8 mm)  
  * X respects bottom critical edge distance if applicable.  
* The new 50 designs are then passed through the verification checks and steel weight checks to be passed back in to the fitness scoring process for another optimisation

\</selection\_and\_breeding\>

\<convergence\_and\_early\_stopping\>

## Convergence and early stopping {#convergence-and-early-stopping}

The algorithm runs for up to 100 generations until following stopping conditions:

* No increase in the maximum fitness core in the population for 20 generations

\</convergence\_and\_early\_stopping\>

\<genetic\_algorithm\_instructions\>

# Rules {#rules}

\<calculation\_rules\>

## Calculation Rules {#calculation-rules}

Precision Requirements for Engineering Calculations

1\. Floating-Point Precision:  
\- All intermediate calculations must maintain full decimal precision  
\- No rounding should occur until the final display of results  
\- When working with very small numbers (\< 0.0001), use all available decimal places

2\. Critical Variables:  
\- Constants like 'a' in quadratic equations must be defined to at least 12 decimal places  
\- Example: a \= 0.0000003968253968 (not 3.96825e-7)

3\. Step-by-Step Verification:  
\- Each intermediate calculation should be logged with at least 12 decimal places  
\- For critical engineering values like forces, moments, and stresses, show values to at least 5 decimal places  
\- For quadratic equations, explicitly show:  
  \* Individual components (e.g., b², 4ac)  
  \* Discriminant value (b²-4ac)  
  \* Final result

4\. Units and Conversions:  
\- All unit conversions must maintain full precision  
\- Document units at each calculation step

5\. Validation Steps:  
\- Include validation steps comparing intermediate values to known checkpoints  
\- Flag any deviations larger than 0.00001 in engineering units

\</calculation\_rules\>

# Calculations {#calculations}

\<loading\_calculations\>

## Loading Calculations {#loading-calculations}

If the user did not know the characteristic load in the initial \<user\_inputs\> then we would use this set of calculations to determine it.

| Loading Calculations |  |  |  |
| :---- | :---- | :---- | :---- |
| **Notation** | **Formula**  | **Unit** | **description**  |
| A\_load | \=M\_d\*M/10^6\*g | kN/m2 | Loaded area in kN/m2 |
| C\_udl | \=IF(L\_pres=”Yes”,(A\_load\*L\_pres,area/10^6/L\_pres,length),A\_load\*M\_h) | kN/m | Characteristic UDL which is the area load multiplied by the masonry height) measured in kN/m.  Takes account of whether a lintel is present. |
| D\_udl | \=C\_udl\*L\_f | kN/m | Design UDL measured in kN/m |
| V\_ed | \=D\_udl\*B\_cc/1000 | kN | Design UDL multiplied by the bracket centres to get the shear force per bracket measured in kN |

\</loading\_calculations\>

\<bracket\_angle\_calculations\>

## Bracket Angle Calculations {#bracket-angle-calculations}

Every time the genetic algorithm generates a system design, it should run the combination of \<user\_inputs\> and \<system\_inputs\> through the following calculations.

Each of these verifications will provide a pass or fail.

\<bracket\_calculations\>

### Bracket Calculations {#bracket-calculations}

Now we will take the outputs from the \<user\_input\> and \<system\_inputs\> tags and calculate the dimensions.

Using the bracket dimensions we calculate this formula:

| Notation | Formula  | Unit | description  |
| :---- | :---- | :---- | :---- |
| C’ | \=C+20 | mm | Design cavity which is cavity add 20mm |

\</bracket\_calculations\>

\<angle\_calculations\>

### Angle Calculations {#angle-calculations}

\<angle\_dimensions\>

Now we will start use the proposed angle dimensions the user provided in the \<system\_inputs\> tag

\</angle\_dimensions\>

Using the bracket dimensions we calculate these formulas:

| Notation | Formula  | Unit | description  |
| :---- | :---- | :---- | :---- |
| d | \=C-D-S | mm | Cavity to back of angle |
| b | \=B-T-d | mm | Length of bearing which is horizontal leg minus the angle thickness minus the cavity to the back of the angle.  |
| R | \=T | mm | Internal radius R \= the same as the angle thickness  |
| Z | \=(B\_cc\*T^2)/6 | mm3 | Section of modulus used for the angle is the bracket centres multiplied by the angle thickness to power of 2 divided by 6\. Measured in mm3 |
| Av | \=B\_cc\*T | mm2 | Shear area measured in mm2 |
| Ixx\_1 | \=(B\_cc\*T^3)12 | mm4 | Second moment of area of the angle in mm4 |

\</angle\_calculations\>

\</bracket\_angle\_calculations\>

\<mathematical\_model\_calculations\>

## Mathematical Model Calculations {#mathematical-model-calculations}

Now we will take the outputs from the previous calculations and use them to calculate the following formulas:

| Notation | Formula  | Unit | description  |
| :---- | :---- | :---- | :---- |
| Ecc | \=M/3 | mm | Masonry thickness / 3  |
| PI() |  |  | The number π is a mathematical constant |
| a | \=Ecc+d+PI()\*(T/2+R)-(T+R) | mm |  |
| b | \=L\_bearing \- Ecc | mm |  |
| I | \=A-(R+T)-16.5 | mm |  |

\</mathematical\_model\_calculations\>

\<mathematical\_model\_required\_output\>

The AI should provide a table showing the calculation results in this format:

| Eccentricity | \[Ecc calculated value\]mm |
| :---- | :---- |
| a | \[a calculated value\]mm |
| b | \[b calculated value\]mm |
| I | \[l calculated value\]mm |

\</mathematical\_model\_required\_output\>

\<angle\_verification\_checks\>

## Angle Verification Checks {#angle-verification-checks}

We will now use the previous inputs and calculations to verify whether the provided inputs pass each of the verifications for angle checks.

\<moment\_resistance\_at\_uls\>

### Moment Resistance at ULS {#moment-resistance-at-uls}

| 1.1 \- Notations |  |  |
| :---- | :---- | :---- |
| **Notation** | **Description** | **Notes** |
| F\_y | Yield Strength of stainless steel | Set value of 210 N/mm2 |
| gamma\_sf | Gamma safety material factor | Set value of 1.1 |

| 1.1 \- Calculations  |  |  |  |
| :---- | :---- | :---- | :---- |
| **Notation** | **Formula**  | **Unit** | **description**  |
| L\_1 | \=Ecc+d+T | mm | Distance force is applied  |
| M\_ed,angle | \=V\_Ed\*(L\_1/1000) | kNm | Moment the angle takes |
| Mc\_rd,angle | \=Z/10^6\*(F\_y)/gamma\_sf | M/mm2 | Moment Capacity of the angle |
| U\_mr | \=(M\_ed,angle/Mc\_rd,angle)\*100 | % | Moment utilisation of the angle needs to be less that 100% |

\<required\_output\>

| 1.1 Moment resistance at ULS |  |
| :---- | :---- |
| V\_ed | \[V\_ed calculated value\]kN |
| L\_1 | \[L\_1 calculated value\]mm |
| M\_Ed,angle | \[M\_Ed,angle calculated value\]kNm |
| F\_y | \[Set value of 210\]N/mm2 |
| gamma\_sf | \[Set value of 1.1\] |
| Mc\_rd,angle | \[Mc\_rd,angle calculated value\]kN/m |
| Utilisation | \[U\_mr calculated value\]% |

\</required\_output\>

\</moment\_resistance\_at\_uls\>

\<shear\_resistance\_at\_uls\>

### Shear Resistance at ULS {#shear-resistance-at-uls}

| 1.2 \- Calculations  |  |  |  |
| :---- | :---- | :---- | :---- |
| **Notation** | **Formula**  | **Unit** | **description**  |
| V\_Rd,angle | \=Av\*(F\_y/((3)^0.5))/gamma\_sf/1000 | kN | Shear capacity of the angle |
| U\_sr | \= (V\_ed/V\_rd,angle)\*100 | % | Shear utilisation of the angle needs to be less than 100%. If the shear utilization is less than 50% then there is no reduction in moment capacity |

\<required\_output\>

| 1.2 Shear resistance at ULS |  |
| :---- | :---- |
| V\_ed | \[V\_ed calculated value\]kN |
| VR\_d,angle | \[VR\_d,angle calculated value\]kN |
| Utilisation | \[U\_sr calculated value\]% |

\</required\_output\>

\</shear\_resistance\_at\_uls\>

\<angle\_deflection\_at\_sls\>

### Angle Deflection at ULS {#angle-deflection-at-uls}

| 1.3 \- Notations |  |  |
| :---- | :---- | :---- |
| **Notation** | **Description** | **Notes** |
| E | Secant resistance for stainless steel | Set value of 200000 N/mm2 |
| n | Parameter of the secant modulus | Set value of 8 |

| 1.3 \- Calculations |  |  |  |
| :---- | :---- | :---- | :---- |
| **Notation** | **Formula**  | **Unit** | **description**  |
| V\_ek | \=V\_ed/L\_f | kN |  |
| M\_ek | \=V\_ek\*L\_1/1000 | kNm |  |
| SLS\_ds | \=M\_ed,angle\*10^6/Z/L\_f | N/mm2 | Design stress SLS |
| Es\_1 | \=E/(1+0.002\*(E/SLS\_ds)\*(SLS\_ds/F\_y)^n) | N/mm2 |  |
| Es\_sr | \= Es\_1 | N/mm2 |  |
| D\_tip | \=V\_ek\*1000\*a^2(3\*(a+b)-a)/(6\*Es\_sr\*Ixx\_1) | mm | Deflection at tip due to the horizontal leg in mm |
| D\_horz | \=M\_ek\*10^6\*I^2(2\*Es\_sr\*Ixx\_1) | mm | Horizontal deflection of the vertical leg |
| rotatation\_heel | \=ATAN(D\_horz/I) | radians | This is using a the excel way to represent Tan^-1 |
| D\_heel | \=B\*SIN(rotatation\_heel) | mm | Deflection due to rotation at the heel. This is using SIN from excel.  |
| D\_total | \=D\_tip \+ D\_heel | mm |  |

\<required\_output\>

| 1.3 \- Angle resistance at ULS |  |
| :---- | :---- |
| **Notation** | **Formula**  |
| V\_ek | \[V\_Ek calculated value\]kN |
| M\_ek | \[M\_ek calculated value\]kNm |
| Es\_1 | \[Es\_1 calculated value\]N/mm2 |
| Es\_sr | \[Es\_sr calculated value\]N/mm2 |
| D\_tip | \[D\_tip calculated value\]mm |
| D\_horz | \[D\_horz calculated value\]mm |
| rotatation\_heel | \[rotation\_heel calculated value\]radians |
| D\_heel | \[D\_heel calculated value\]mm |
| **D\_total** | **\[D\_total calculated value\]mm** |

\</required\_output\>

\</angle\_deflection\_at\_sls\>

\<angle\_to\_bracket\_connection\>

### Angle to Bracket Connection {#angle-to-bracket-connection}

| 1.4 \- Notations |  |  |
| :---- | :---- | :---- |
| **Notation** | **Description** | **Notes** |
| stess\_area\_bolt | Cross sectional area of a bolt | Set value for M10 and M12. M10 it is 58 mm2 M12 is 84.3 mm2 |
| F\_ub | Ultimate tensile strength of a bolt  | Set value of 700 N/mm2 |
| yM2 | Bolt material safety factor | Set value of 1.25 |
| a | Factor used from Eurocode 93-8 | Set value of 0.9 |

| 1.4 \- Calculations |  |  |  |
| :---- | :---- | :---- | :---- |
| **Notation** | **Formula**  | **Unit** | **description**  |
| M\_b | \=V\_ed\*(B-b+10)/1000 | kNm | Moment force on the bolt kNm |
| N\_bolt | \=M\_b/(I/1000) | kN | Tension force in the bolt |
| V\_bolt\_resistance | \=0.5\*F\_ub\*stess\_area\_bolt/yM2/1000 | kN | Total shear resistance of the bolt given the conditions   |
| U\_v\_bolt | \=V\_ed/V\_bolt\_resistance | % | Utilization of the bolt in shear. |
| N\_bolt\_resistance | \=a\*stess\_area\_bolt\*F\_ub/yM2/1000 | kN | Total tension resistance of the bolt |
| U\_n\_bolt | \=N\_bolt/N\_bolt\_resistance | % | Utilization of the bolt in tension. Flag if its over 100% and would need to switch to M12 bolt. |
| U\_c\_bolt | \=U\_v\_bolt+(N\_bolt/(1.4\*N\_bolt\_resistance)) | % | Combined utilization check of the bolt in tension and shear. |

\<required\_output\>

| 1.4. \- Angle to bracket connection |  |
| :---- | :---- |
| Shear in bolt | \[V\_ed calculated value\]kN |
| Moment | \[M\_b calculated value\]kNm |
| RTB (Rise to bolt) | \[I calculated value\]mm |
| Tensile in bolt | \[N\_bolt calculated value\]kN |
| Stress Area M10 | \[set value\] |
| F\_ub ultimate tensile strength of bolt | \[set value\] |
| yM2 bolt material safety factor | \[set value\] |
| a factor from Eurocode | \[set value\] |
| Shear resistance | \[V\_bolt\_resistance calculated value\]kN |
|  | \[U\_v\_bolt calculated value\]% |
| Tensile resistance | \[N\_bolt\_resistance calculated value\]kN |
|  | \[U\_n\_bolt calculated value\]% |
| Combined | \[U\_c\_bolt calculated value\]% |

\</required\_output\>

\</angle\_to\_bracket\_connection\>

\<shear\_reduction\_due\_to\_packers\>

### Shear Reduction Due to Packers {#shear-reduction-due-to-packers}

| 1.4.1 \- Notations |  |  |
| :---- | :---- | :---- |
| **Notation** | **Description** | **Notes** |
| t\_p | Thickness of packing shims | Value determined by the user |

| 1.4.1 \- Calculations |  |  |  |
| :---- | :---- | :---- | :---- |
| **Notation** | **Formula**  | **Unit** | **description**  |
| beta\_p | (9\*d\_p)/(8\*d\_p \+ 3\*t\_p) but beta\_p\<=1 |  |  |
| V\_rd,bolt | \=beta\_p\*V\_bolt\_resistance | kN |  |
| U\_c\_bolt\_packers | \=V\_ed/V\_rd,bolt+(N\_bolt/(1.4\*N\_bolt\_resistance)) | % | Combined utilization of the bolt with the impact of adding shims |

\<required\_output\>

| 1.4.1 \- Shear Reduction due to packers |  |
| :---- | :---- |
| Packing shim thickness | \[user input\]mm |
| Packing shim diameter | \[user input\]mm |
| beta\_p | \[beta\_p calculated value\]mm |
| V\_rd | \[V\_rd,bolt calculated value\]kN |
| T\_rd | \[T\_rd calculated value\]kN (Note that T\_rd remains unchanged by the packer reduction factor (βₚ) and uses the original calculated value) |
| Combined | \[U\_c\_bolt\_packers calculated value\]% |

\</shear\_reduction\_due\_to\_packers\>

\<bracket\_design\>

### Bracket Design {#bracket-design}

| 1.5 \- Notations |  |  |
| :---- | :---- | :---- |
| **Notation** | **Description** | **Notes** |
| n\_p | Number of plates per channel | Defined value set at 2 |
| ε | Set value | Value is 1.058 |

| 1.5 \- Calculations |  |  |  |
| :---- | :---- | :---- | :---- |
| **Notation** | **Formula**  | **Unit** | **description**  |
| d\_c | \=L-H\_notch | mm | Depth of the channel (bracket) |
| d\_ct | \=d\_c/t |  |  |
| bracket\_class1\_check | \= 56\*ε \>45.67 then Class 1 |  | TAKEN FROM Table 5.2 BS EN 1993-1-4 |
| M\_ed\_bracket | \=V\_ed\*(C+Ecc)/1000 | kNm | Moment taken by the bracket in kNm |
| W\_pl\_c | \=1.2\*t\*d\_c^2/6\*n\_p | mm3 | Semi-Plastic Modulus of Section in mm^3 |
| M\_rd\_bracket | \=(F\_y\*W\_pl\_c/1.1)/1000000 | kNm | Moment capacity of the channel |
| Bracket\_check | \=M\_rd\_bracket\>=M\_ed\_bracket |  | Moment resistance of the bracket needs to be greater than the moment applied |

\<required\_output\>

| 1.5 Bracket design |  |
| :---- | :---- |
| Vertical Plate Moment Check |  |
| Bracket thickness | \[t user input value\]mm |
| Number of plates per channel | \[n\_p user input value\] |
| Height of bracket notch | \[H\_notch user input value\]mm |
| Depth of channel | \[d\_c calculated value\]mm |
| dc/t | \[d\_ct calculated value\] |
| ε | \[set value\] |
| 56xε | \[56\*ε calculated value\] |
|  | \[calculated value \=IF(56\*ε \>d\_ct,”Therefore Class 1”,”Not Class 1, Check\!”)\] |
| Moment taken by bracket (M\_ed,c) | \[M\_ed\_bracket calculated value\]kNm |
| Semi-plastic modulus of section (W\_pl,c) | \[W\_pl\_c calculated value\]mm3 |
| Moment capacity of channel | \[M\_rd\_bracket calculated value\] |
|  | \[calculated value \=If(M\_rd\_bracket\>=M\_ed\_bracket,”Therefore OK\!”,””Therefore NOT OK\!”)\] |
|  |  |

\</required\_output\>

\</bracket\_design\>

\<deflection\_due\_to\_bracket\_dropping\_below\_slab\>

### Deflection Due To Bracket Dropping Below Slab {#deflection-due-to-bracket-dropping-below-slab}

This check only needs to be run where P\>0 when the bracket projects below the slab as per this image.

This is to make sure to consider the correct projection for the component of the bracket that is put into bending as a result of its drop. Our calculation shows the projection at the height of the fixing.  

![][image10]

| 1.6 \- Notations  |  |  |
| :---- | :---- | :---- |
| **Notation** | **Description** | **Notes** |
| P | Drop below the slab | Calculated value dependent on system design |
| B\_proj,fix | This is the distance the bracket projects out into the cavity at the height of the fixing | Will be the same as D Bracket Projection |
| Def\_included | Should additional deflection due to span be included? | Default is yes |

| 1.6 \- Ixx\_3 lookup table |  |
| :---- | :---- |
| Angle Thickness (mm) | Iz |
| 3 | 139727 |
| 4 | 180849 |
| 5 | 218359 |
| 6 | 255683 |
| 8 | 617257 |
| 10 | 741102 |

| 1.6 \- Calculations |  |  |  |
| :---- | :---- | :---- | :---- |
| **Notation** | **Formula**  | **Unit** | **description**  |
| Ixx\_3 | VLookup for corresponding A\_t (angle thickness) from 1.6 \- Ixx\_3 look up table) |  |  |
| P\_eff | \=IF(H\_notch\>P THEN H\_notch ELSE P) | mm | Using an excel formula here to define the logic.We’re calculating the effective drop below the slab. |
| L\_d | \=C’+Ecc | mm | Design cavity plus the eccentricity |
| M\_ek,drop | \=V\_ek\*L/1000 | kNm | Moment in kNm |
| Ixx\_2 | \=2\*(t\*B\_proj,fix^3)/12 | mm4 | Second moment of area |
| L\_deflection | \=IF(P=0,0,(M\_ek\_drop\*10^6\*P\_eff^2/(2\*200000\*Ixx\_2))) | mm | Lateral deflection in mm |
| rotatation\_heel\_2 | \=IF(P=0,0,ATAN(L\_deflection/P\_eff)) | radians | This is using a the excel way to represent Tan^-1 |
| D\_heel\_2 | \=IF(P=0,0,(C’+L\_bearing)\*SIN(rotatation\_heel\_2)) | mm | Angle deflection due to rotation at the heel due to the bracket dropping. This is using SIN from excel.  |
| Total\_Vertical\_Deflection | \=D\_heel\_2+D\_total | mm |  |
| Addition\_deflection\_span | \=(5\*C\_udl\*1000\*B\_cc^3)/384\*Es\_sr\*Ixx\_3) | mm |  |
| Total\_deflection\_of\_system | \=IF(Def\_included’”Yes”,Total\_Vertical\_Deflection+Addition\_deflection\_span,Total\_Vertical\_Deflection) | mm | Looks at whether additional deflection due to span is included in the total |

\<required\_output\>

| 1.6 Deflection due to bracket dropping below slab |  |
| :---- | :---- |
| Drop below slab | \[P calculated value\]mm |
| Height of notch | \[H\_notch user input\]mm |
| Effective drop below slab | \[P\_eff calculated value\] |
| V\_ek | \[V\_ek calculated value\]kN |
| L\_d | \[L\_d calculated value\]mm |
| M\_ek,drop | \[M\_ek,drop calculated value\]kNm |
| Bracket projection (at fixing) | \[B\_proj,fix calculated value\]mm |
| Ixx\_2 second moment of area | \[Ixx\_2 calculated value\]mm4 |
| Lateral deflection | \[L\_deflection calculated value\]mm |
| Rotation at heel | \[rotatation\_heel\_2 calculated value\]radians |
| Angle deflection due to rotation | \[D\_heel\_2 calculated value\]mm |

\</required\_output\>

\</deflection\_due\_to\_bracket\_dropping\_below\_slab\>

\<total\_deflection\>

| Total Deflection |  |  |  |
| :---- | :---- | :---- | :---- |
| Total\_Vertical\_Deflection | \=D\_heel\_2+D\_total | mm |  |
| Addition\_deflection\_span | \=(5\*C\_udl\*1000\*B\_cc^3)/384\*Es\_sr\*Ixx\_3) | mm |  |
| Total\_deflection\_of\_system | \=IF(Def\_included’”Yes”,Total\_Vertical\_Deflection+Addition\_deflection\_span,Total\_Vertical\_Deflection) | mm | Looks at whether additional deflection due to span is included in the total |

\</total\_deflection\>

\</angle\_verification\_checks\>

\<fixing\_check\>

## Fixing Check {#fixing-check}

| 2 \- Notations  |  |  |
| :---- | :---- | :---- |
| **Notation** | **Description** | **Notes** |
| C\_grade | Concrete grade (compressive strength) | Default is 30\. Value determined by the user in N/mm2  |

\<tensile\_load\_in\_stud\_group\>

### Tensile Load in Stud Group {#tensile-load-in-stud-group}

| 2 \- Tensile Load in Stud Group Inputs |  |  |  |
| :---- | :---- | :---- | :---- |
| **Notation** | **Formula**  | **Unit** | **description**  |
| Moment\_to\_be\_resisted | \=M\_Ed\*1000 | Nm | Moment to be resisted converted to Nm |
| Base\_plate\_width\_M | \=w/1000 | m | Base plate width converted to metres |
| Rise\_to\_bolts\_M | \=x/1000 | m | Rise to bolts converted to metres |
| Grade\_of\_concrete\_NM2 | \=C\_grade\*1000000 | N/m2 | Grade of concrete converted to N/m2 |

| 2 \- Tensile Load in Stud Group Calculations |  |  |
| :---- | :---- | :---- |
| **Notation** | **Formula**  | **Units** |
| a | \=(⅔)\*(1/(Grade\_of\_concrete\_NM2\*Base\_plate\_width\_M)) |  |
| b | \=-Rise\_to\_bolts\_M |  |
| c | \=Moment\_to\_be\_resisted |  |
|  | \=b2\-4ac |  |
|  | \=-b |  |
|  | \=2a |  |
| Tensile\_Load\_in\_stud group\_Fa\_N | \=(-b-SQRT(b2\-4ac))/(2a) | N |
| Tensile\_Load\_in\_stud group\_Fa\_kN | \=Tensile\_Load\_in\_stud group\_Fa\_N/1000 | kN |
| Length\_of\_compression\_zone\_m | \=2\*Tensile\_Load\_in\_stud group\_Fa\_N/(Grade\_of\_concrete\_NM2\*Base\_plate\_width\_M) | m |
| Length\_of\_compression\_zone\_mm | \=Length\_of\_compression\_zone\_m\*1000 | mm |

| 2\. Tensile Load in Stud Group Checks |  |  |
| :---- | :---- | :---- |
| Check | Formula | User Notification |
| Check\_moment\_equilibrium | \=Tensile\_Load\_in\_stud group\_Fa\_N\*(Rise\_to\_bolts\_M-Length\_of\_compression\_zone\_m)+Grade\_of\_concrete\_NM2\*Base\_plate\_width\_M\*(⅓)\*Length\_of\_compression\_zone\_m\*(Length\_of\_compression\_zone\_m-Moment\_to\_be\_resisted) | \=If(Check\_moment\_equilibrium\<0.00001,”Calculation Working”,”Calculation Not Working\!”) |
| Check\_shear\_equilibrium | \=Tensile\_Load\_in\_stud group\_Fa\_N-Length\_of\_compression\_zone\_m\*Grade\_of\_concrete\_NM2\*Base\_plate\_width\_M\*0.5) | \=If(Check\_shear\_equilibrium\<0.00001,”Calculation Working”,”Calculation Not Working\!”) |
| Depth\_check |  | \=IF(Length\_of\_compression\_zone\_m\>Rise\_to\_bolts\_M,”Error \- Depth Insufficient\!”,”Depth OK” |

\</tensile\_load\_in\_stud\_group\>

| 2 \- Calculations |  |  |  |
| :---- | :---- | :---- | :---- |
| **Notation** | **Formula**  | **Unit** | **description**  |
| V\_ed | \=V\_ek\*L\_f | kN |  |
| L\_3 | \=C’+(M/3) | mm |  |
| M\_ed | \=V\_ed\*L\_3/1000 | kNm |  |
| N\_ed | \=Tensile\_Load\_in\_stud group\_Fa\_kN | kN |  |

\</fixing\_check\>

\<combined\_tension\_and\_sheer\_calculations\>

## Combined Tension and Sheer Calculations {#combined-tension-and-sheer-calculations}

![][image11]

| Combined Tension and Sheer Calculation |  |
| :---- | :---- |
| **Formula**  | **description**  |
| (N\_Ed/N\_Rd,i)^1.5+(V\_Ed/V\_Rd,i)^1.5\<=1 or (N\_Ed/N\_Rd,i)+(V\_Ed/V\_Rd,i)\<=1.2 | Either of these formulas can be passed to be a validated design |

\</combined\_tension\_and\_sheer\_calculations\>

\<final\_output\>

# Final Output {#final-output}

Having completed the genetic algorithm, steel weight and verification checks, you should present a final summary report that shows the optimised design

| Design Summary |  |  |  |
| :---- | :---- | :---- | :---- |
| **Notation** | **Result** | **Unit** |  |
| V\_ed | \=V\_ek\*L\_f | kN |  |
| M\_ed | \=V\_ed\*L\_3/1000 | kNm |  |
| N\_ed | \=Tensile\_Load\_in\_stud group\_Fa\_kN | kN |  |
| Total System Deflection | \=\[Total\_deflection\_of\_system calculated value\]mm | mm | Maximum allowed is 1.5mm.  Any higher and this system should fail the tests. |
| Angle Utilisation | \[U\_mr calculated value\]% | % |  |
| Design specifications | Bracket centres (B\_cc) Bracket height (L) Rise to bolts (X) Bracket thickness (t) Bracket projection  (D) Bolt diameter (d\_p) Angle thickness (T) Vertical leg (A) Horizontal leg (B) Channel type |  |  |
| Number of generations |  | \# | How many generations of the genetic algorithm were completed before the final optimized design was found |
| Initial weight |  | kg/m | The lowest weight solution in the initial generation |
| Optimal design weight |  | kg/m | The steel weight of the optimal design |

\</final\_output\>