# The Moons of Eberron
Visualisation project by Imogen Gingell

## How Does it Work?

The orbital radii and moon radii are given in the *Dragonshards* article *The Moons of Eberron*, released on the Wizards of the Coast website during the 3rd-Edition era of D&D. Given the orbit and moon sizes described in this article, we can calculate the moon's orbital periods using [Kepler's laws](https://en.wikipedia.org/wiki/Kepler%27s_laws_of_planetary_motion). All the rest is geometry! 

### Assumptions

The Moons of Eberron article doesn't provide *everything* we need to know to fully model the system. The following assumptions are made as part of this model:
* The moon orbits are all circular.
* The moons orbit in the same direction as the planet's rotation.
* The moons do not have any mass. This is not an N-body gravity simulation!
* The moons all orbit in the same plane, which is the the planet Eberron's equatorial plane.
* There is a conjunction of all the moons opposite the Sun at t=0, which corresponds to midnight on the first day of 1YK.
* The planet has no axial tilt. Seasons occur due to the influence of Fernia and Risia.

## FAQs

**Why don't the moon phases match the online calendar tool?**  
The calendar tool was written to use arbitrary orbital periods, persumably with the aim of giving a satisfying or more realistic range of moon phase periods. For this tool, the moons follow Kepler's Laws, leading to some of the nearer moons like Zarantyr and Olarune moving extremely quickly through the sky. I may add an option in the future to fix the moon periods to the same as those used by the calendar tool.

**How did you come up with timezones?**  
The timezone suggestions given in the Set Time box assume that:
* The 5000 mile scale bar given on the inside cover map of the 3.5e Eberron campaign setting is reasonable along the equator.
* The planet's circumference is the same as Earth.
The benefit of this is that it leads to 'reasonable' seeming timezones across Khorvaire. For example, the whole continent is about 5 timezones wide, similar to North America. One drawback is that this would mean there is an enormous ocean on the 'far' side of the planet, which stretches the credibility of eastern migrations from Sarlona to Khorvaire.
