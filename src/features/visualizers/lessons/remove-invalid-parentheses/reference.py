class Solution:
    def removeInvalidParentheses(self, s: str) -> list[str]:
        
        min_num = 0
        stack = []

        for par in s:
            if par == '(':
                stack.append(par)
            elif par == ')':
                if stack:
                    stack.pop()
                else:
                    min_num += 1
            else:
                continue
        
        min_num += len(stack)
        stack.clear()

        def check(s_loc):
            if s_loc.count('(') != s_loc.count(')'):
                return False
            
            loc_stack = []

            for par in s_loc:
                if par == '(':
                    loc_stack.append(par)
                elif par == ')':
                    if not loc_stack:
                        return False
                    loc_stack.pop()
                else:
                    continue
            
            return True if not loc_stack else False
        
        def backtrack(removes, max_removes, s_loc, ind):
            
            if removes == max_removes:
                if s_loc not in seen and check(s_loc):
                    seen.add(s_loc)
                    stack.append(s_loc)
                return
            
            for i in range(ind, len(s_loc)):
                if s_loc[i] == '(' or s_loc[i] == ')':
                    backtrack(removes+1, max_removes, s_loc[:i] + s_loc[i+1:], i)
            
            return
        
        seen = set()
        backtrack(0, min_num, s, 0)
        return stack
