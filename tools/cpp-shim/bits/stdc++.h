// Stand-in for GCC's <bits/stdc++.h>, which Apple clang (macOS's g++) does not
// ship. tools/verify-dsa.mjs puts this directory on CPLUS_INCLUDE_PATH, so the
// reference solutions compile unchanged on a Mac. Under real GCC this shim is found
// first too, which is harmless: it pulls in every header the solutions use.
#include <algorithm>
#include <array>
#include <bitset>
#include <cassert>
#include <climits>
#include <cmath>
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <deque>
#include <functional>
#include <iostream>
#include <iterator>
#include <list>
#include <map>
#include <numeric>
#include <queue>
#include <set>
#include <sstream>
#include <stack>
#include <string>
#include <tuple>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>
